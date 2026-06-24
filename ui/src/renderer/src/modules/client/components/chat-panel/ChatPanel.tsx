import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showApiErrorMessage } from '@renderer/core/utils/dialogMessages'
import ClientService from '../../services/ClientService'
import type { ClientChatMessage } from '../../types/Client'
import styles from './chat-panel.module.css'

interface Props {
  messages: ClientChatMessage[]
  connected: boolean
}

export default function ChatPanel({ messages, connected }: Props) {
  const { t } = useTranslation('client')
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || !connected) return
    setInput('')
    try {
      await ClientService.sendChat(text)
    } catch (e) {
      showApiErrorMessage(e)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.bubbleWrapper} ${m.from_server ? styles.left : styles.right}`}
          >
            <span className={styles.sender}>{m.name}</span>
            <div className={`${styles.bubble} ${m.from_server ? styles.bubbleServer : styles.bubbleClient}`}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? t('chat.placeholder') : t('chat.notConnected')}
          disabled={!connected}
          rows={2}
        />
        <button
          className={styles.sendButton}
          onClick={handleSend}
          disabled={!connected || !input.trim()}
        >
          {t('chat.send')}
        </button>
      </div>
    </div>
  )
}
