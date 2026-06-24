import { useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "@renderer/core/components/button/Button"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import communicationService from "../../services/CommunicationService"
import { ServerStatus } from "../../types/Communication"
import styles from "./server-panel.module.css"

type Props = {
  status: ServerStatus
  onStatusChange: (status: ServerStatus) => void
}

const DEFAULT_TCP = 4444
const DEFAULT_UDP = 5555

export default function ServerPanel({ status, onStatusChange }: Props) {
  const { t } = useTranslation("communication", { keyPrefix: "components.serverPanel" })
  const [portTcp, setPortTcp] = useState<number>(DEFAULT_TCP)
  const [portUdp, setPortUdp] = useState<number>(DEFAULT_UDP)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      if (status.online) {
        await communicationService.stopServer()
      } else {
        await communicationService.startServer({ port_tcp: portTcp, port_udp: portUdp })
      }
      const res = await communicationService.getStatus()
      onStatusChange(res.data)
    } catch (error) {
      showApiErrorMessage(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={styles["server-panel"]}>
      <h3 className={styles.title}>{t("title")}</h3>

      {!status.online && (
        <div className={styles["port-row"]}>
          <label className={styles.label}>
            <span className={styles["label-text"]}>{t("portTcp")}</span>
            <input
              className={styles.input}
              type="number"
              value={portTcp}
              min={1024}
              max={65535}
              onChange={(e) => setPortTcp(Number(e.target.value))}
            />
          </label>
          <label className={styles.label}>
            <span className={styles["label-text"]}>{t("portUdp")}</span>
            <input
              className={styles.input}
              type="number"
              value={portUdp}
              min={1024}
              max={65535}
              onChange={(e) => setPortUdp(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {status.online && (
        <div className={styles["info-row"]}>
          <span>{t("localIp")}: <strong>{status.local_ip}</strong></span>
          <span>{t("portTcp")}: <strong>{status.port_tcp}</strong></span>
          <span>{t("portUdp")}: <strong>{status.port_udp}</strong></span>
          <span>{t("clients")}: <strong>{status.clients.length}</strong></span>
        </div>
      )}

      <Button
        styleType={status.online ? "danger" : "default"}
        borderRadius="sm"
        onClick={handleToggle}
        isLoading={isLoading}
        className={styles.button}
      >
        {status.online ? t("stop") : t("start")}
      </Button>
    </section>
  )
}
