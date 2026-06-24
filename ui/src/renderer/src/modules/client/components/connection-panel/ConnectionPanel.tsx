import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showApiErrorMessage } from '@renderer/core/utils/dialogMessages'
import ClientService from '../../services/ClientService'
import type { ConnectionStatus } from '../../types/Client'
import styles from './connection-panel.module.css'

const IP_REGEX =
  /^((0|1\d?\d?|2[0-4]?\d?|25[0-5]?|[3-9]\d?)\.){3}(0|1\d?\d?|2[0-4]?\d?|25[0-5]?|[3-9]\d?)$/

interface Props {
  status: ConnectionStatus
  onConnected: () => void
  onDisconnected: () => void
}

export default function ConnectionPanel({ status, onConnected, onDisconnected }: Props) {
  const { t } = useTranslation('client')
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('')
  const [name, setName] = useState(`Researcher${Math.floor(Math.random() * 100001) + 1}`)
  const [loading, setLoading] = useState(false)

  const ipValid = IP_REGEX.test(ip)
  const portNum = parseInt(port, 10)
  const portValid = !isNaN(portNum) && portNum > 1001 && portNum < 10000
  const canConnect = ipValid && portValid && name.trim().length > 0

  async function handleConnect() {
    setLoading(true)
    try {
      await ClientService.connect({ ip, port: portNum, name })
      onConnected()
    } catch (e) {
      showApiErrorMessage(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      await ClientService.disconnect()
      onDisconnected()
    } catch (e) {
      showApiErrorMessage(e)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canConnect && !status.connected) handleConnect()
  }

  if (status.connected) {
    return (
      <div className={styles.panel}>
        <div className={styles.statusBadge}>{t('panel.connected')}</div>
        <p className={styles.statusDetail}>
          {status.server_ip}:{status.server_port}
        </p>
        <p className={styles.statusDetail}>{t('panel.user')}: {status.name}</p>
        {status.udp_active && (
          <p className={styles.udpBadge}>{t('panel.udpActive')}</p>
        )}
        {status.capture_plugins.length > 0 && (
          <div className={styles.plugins}>
            <p className={styles.pluginsLabel}>{t('panel.plugins')}:</p>
            {status.capture_plugins.map((p) => (
              <span key={p} className={styles.pluginTag}>{p}</span>
            ))}
          </div>
        )}
        <button
          className={styles.disconnectButton}
          onClick={handleDisconnect}
          disabled={loading}
        >
          {t('panel.disconnect')}
        </button>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>{t('panel.title')}</h3>
      <label className={styles.label}>{t('panel.ip')}</label>
      <input
        className={styles.input}
        type="text"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="192.168.1.1"
      />
      <label className={styles.label}>{t('panel.port')}</label>
      <input
        className={styles.input}
        type="number"
        value={port}
        onChange={(e) => setPort(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="4444"
        min={1002}
        max={9999}
      />
      <label className={styles.label}>{t('panel.username')}</label>
      <input
        className={styles.input}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        className={styles.connectButton}
        onClick={handleConnect}
        disabled={!canConnect || loading}
      >
        {loading ? t('panel.connecting') : t('panel.connect')}
      </button>
    </div>
  )
}
