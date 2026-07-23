import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClientService from '../../services/ClientService'
import ConnectionPanel from '../../components/connection-panel/ConnectionPanel'
import ChatPanel from '../../components/chat-panel/ChatPanel'
import NotesPanel from '../../components/notes-panel/NotesPanel'
import type { ClientChatMessage, ClientNoteMessage, ClientWsEvent, ConnectionStatus } from '../../types/Client'
import styles from './client-page.module.css'

const DEFAULT_STATUS: ConnectionStatus = {
  connected: false,
  server_ip: null,
  server_port: null,
  name: null,
  udp_active: false,
  capture_plugins: []
}

export default function ClientPage() {
  const { t } = useTranslation('client')
  const [status, setStatus] = useState<ConnectionStatus>(DEFAULT_STATUS)
  const [chatMessages, setChatMessages] = useState<ClientChatMessage[]>([])
  const [notes, setNotes] = useState<ClientNoteMessage[]>([])
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat')
  const wsRef = useRef<WebSocket | null>(null)
  const wsEventHandlerRef = useRef<((event: ClientWsEvent) => void) | null>(null)

  const refreshStatus = useCallback(async () => {
    try {
      const { data } = await ClientService.getStatus()
      setStatus(data)
    } catch {
      setStatus(DEFAULT_STATUS)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    try {
      const [chatRes, notesRes] = await Promise.all([
        ClientService.getChatHistory(),
        ClientService.getNotesHistory()
      ])
      setChatMessages(chatRes.data)
      setNotes(notesRes.data)
    } catch {
      // ignore
    }
  }, [])

  const handleWsEvent = (event: ClientWsEvent) => {
    if (event.type === 'chat_message') {
      setChatMessages((prev) => [...prev, event.message])
    } else if (event.type === 'note_received') {
      setNotes((prev) => [...prev, event.note])
    } else if (event.type === 'capture_plugins_updated') {
      setStatus((prev) => ({ ...prev, capture_plugins: event.capture_plugins }))
    } else if (event.type === 'disconnected') {
      setStatus(DEFAULT_STATUS)
      wsRef.current?.close()
      wsRef.current = null
    }
  }

  wsEventHandlerRef.current = handleWsEvent

  const openWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    wsRef.current = ClientService.openWebSocket(
      (event: ClientWsEvent) => {
        wsEventHandlerRef.current?.(event)
      },
      () => {
        // WebSocket closed
      }
    )
  }, [])

  useEffect(() => {
    refreshStatus()
    loadHistory()
    return () => {
      wsRef.current?.close()
    }
  }, [refreshStatus, loadHistory])

  useEffect(() => {
    if (status.connected && !wsRef.current) {
      openWebSocket()
    }
  }, [status.connected, openWebSocket])

  async function handleConnected() {
    await refreshStatus()
    await loadHistory()
    openWebSocket()
  }

  async function handleDisconnected() {
    wsRef.current?.close()
    wsRef.current = null
    setStatus(DEFAULT_STATUS)
    setChatMessages([])
    setNotes([])
  }

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <ConnectionPanel
          status={status}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
        />
      </aside>

      <main className={styles.main}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            {t('page.chat')}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            {t('page.notes')}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'chat' ? (
            <ChatPanel messages={chatMessages} connected={status.connected} />
          ) : (
            <NotesPanel notes={notes} connected={status.connected} />
          )}
        </div>
      </main>
    </div>
  )
}
