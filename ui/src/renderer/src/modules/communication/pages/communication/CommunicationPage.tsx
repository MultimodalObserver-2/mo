import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import communicationService from "../../services/CommunicationService"
import ServerPanel from "../../components/server-panel/ServerPanel"
import ClientList from "../../components/client-list/ClientList"
import ChatPanel from "../../components/chat-panel/ChatPanel"
import NotesPanel from "../../components/notes-panel/NotesPanel"
import { ChatMessage, NoteMessage, ServerStatus, WsEvent } from "../../types/Communication"
import styles from "./communication.module.css"

const SENDER_NAME = "Server"

export default function CommunicationPage() {
  const { t } = useTranslation("communication", { keyPrefix: "pages.communication" })
  const [status, setStatus] = useState<ServerStatus>({ online: false, clients: [] })
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [notes, setNotes] = useState<NoteMessage[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const handleWsEventRef = useRef<((event: WsEvent) => void) | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await communicationService.getStatus()
      setStatus(res.data)
    } catch {
      // server not yet available
    }
  }

  const loadHistory = async () => {
    try {
      const [chatRes, notesRes] = await Promise.all([
        communicationService.getChatHistory(),
        communicationService.getNotesHistory(),
      ])
      setChatMessages(chatRes.data)
      setNotes(notesRes.data)
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    const ws = communicationService.openWebSocket((ev: MessageEvent) => {
      try {
        const event: WsEvent = JSON.parse(ev.data)
        handleWsEventRef.current?.(event)
      } catch {
        // ignore parse errors
      }
    })
    ws.onclose = () => {
      wsRef.current = null
    }
    wsRef.current = ws
  }

  const handleWsEvent = (event: WsEvent) => {
    switch (event.event) {
      case "client_connected":
      case "client_disconnected":
        fetchStatus()
        break
      case "chat_message":
        setChatMessages((prev) => [...prev, event.payload])
        break
      case "note_received":
        setNotes((prev) => [...prev, event.payload])
        break
    }
  }

  handleWsEventRef.current = handleWsEvent

  const handleStatusChange = (newStatus: ServerStatus) => {
    setStatus(newStatus)
    if (!newStatus.online) {
      wsRef.current?.close()
      wsRef.current = null
      setChatMessages([])
      setNotes([])
    }
  }

  useEffect(() => {
    fetchStatus()
    return () => {
      wsRef.current?.close()
    }
  }, [])

  useEffect(() => {
    if (status.online) {
      loadHistory()
      connectWebSocket()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.online])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h2 className={styles["page-title"]}>{t("title")}</h2>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <ServerPanel status={status} onStatusChange={handleStatusChange} />
          <ClientList clients={status.clients} />
        </aside>

        <main className={styles.main}>
          <ChatPanel
            messages={chatMessages}
            senderName={SENDER_NAME}
            online={status.online}
          />
          <NotesPanel notes={notes} />
        </main>
      </div>
    </div>
  )
}
