import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import Button from "@renderer/core/components/button/Button"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import communicationService from "../../services/CommunicationService"
import { ChatMessage } from "../../types/Communication"
import styles from "./chat-panel.module.css"

type Props = {
  messages: ChatMessage[]
  senderName: string
  online: boolean
}

export default function ChatPanel({ messages, senderName, online }: Props) {
  const { t } = useTranslation("communication", { keyPrefix: "components.chatPanel" })
  const [text, setText] = useState("")
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || !online) return
    setIsSending(true)
    try {
      await communicationService.sendMessage({ name: senderName, content: trimmed })
      setText("")
    } catch (error) {
      showApiErrorMessage(error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts: number) => {
    return new Date(ts * 1000).toLocaleTimeString()
  }

  return (
    <section className={styles["chat-panel"]}>
      <h3 className={styles.title}>{t("title")}</h3>

      <div className={styles["messages-container"]}>
        {messages.length === 0 && (
          <p className={styles.empty}>{t("noMessages")}</p>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.bubble} ${msg.from_server ? styles.server : styles.client}`}
          >
            <span className={styles["bubble-name"]}>{msg.name}</span>
            <span className={styles["bubble-content"]}>{msg.content}</span>
            <span className={styles["bubble-time"]}>{formatTime(msg.timestamp)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles["input-row"]}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={online ? t("placeholder") : t("serverOffline")}
          disabled={!online || isSending}
          rows={2}
        />
        <Button
          styleType="default"
          borderRadius="sm"
          onClick={handleSend}
          disabled={!online || !text.trim()}
          isLoading={isSending}
          className={styles["send-button"]}
        >
          {t("send")}
        </Button>
      </div>
    </section>
  )
}
