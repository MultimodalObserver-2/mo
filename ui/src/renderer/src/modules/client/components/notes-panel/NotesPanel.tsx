import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showApiErrorMessage } from '@renderer/core/utils/dialogMessages'
import ClientService from '../../services/ClientService'
import type { ClientNoteMessage } from '../../types/Client'
import styles from './notes-panel.module.css'

interface Props {
  notes: ClientNoteMessage[]
  connected: boolean
}

export default function NotesPanel({ notes, connected }: Props) {
  const { t } = useTranslation('client')
  const [writing, setWriting] = useState(false)
  const [content, setContent] = useState('')
  const [timeBegin, setTimeBegin] = useState<number | null>(null)
  const [sending, setSending] = useState(false)

  function handleNewNote() {
    setTimeBegin(Date.now() / 1000)
    setContent('')
    setWriting(true)
  }

  function handleCancel() {
    setWriting(false)
    setContent('')
    setTimeBegin(null)
  }

  async function handleSend() {
    if (!content.trim() || timeBegin === null) return
    const timeEnd = Date.now() / 1000
    setSending(true)
    try {
      await ClientService.sendNote({ content: content.trim(), time_begin: timeBegin, time_end: timeEnd })
      setWriting(false)
      setContent('')
      setTimeBegin(null)
    } catch (e) {
      showApiErrorMessage(e)
    } finally {
      setSending(false)
    }
  }

  function formatTime(ts: number) {
    return new Date(ts * 1000).toLocaleTimeString()
  }

  function formatDuration(begin: number, end: number) {
    const secs = Math.round(end - begin)
    return `${secs}s`
  }

  return (
    <div className={styles.container}>
      <div className={styles.notes}>
        {notes.length === 0 && (
          <p className={styles.empty}>{t('notes.empty')}</p>
        )}
        {notes.map((n, i) => (
          <div key={i} className={styles.noteCard}>
            <div className={styles.noteHeader}>
              <span className={styles.noteName}>{n.name}</span>
              <span className={styles.noteTime}>{formatTime(n.timestamp)}</span>
              <span className={styles.noteDuration}>
                {formatDuration(n.time_begin, n.time_end)}
              </span>
            </div>
            <p className={styles.noteContent}>{n.content}</p>
          </div>
        ))}
      </div>

      {writing ? (
        <div className={styles.editor}>
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('notes.placeholder')}
            rows={3}
            autoFocus
          />
          <div className={styles.editorActions}>
            <button className={styles.cancelButton} onClick={handleCancel} disabled={sending}>
              {t('notes.cancel')}
            </button>
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={!content.trim() || sending}
            >
              {sending ? t('notes.sending') : t('notes.send')}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.footer}>
          <button
            className={styles.newNoteButton}
            onClick={handleNewNote}
            disabled={!connected}
          >
            {t('notes.newNote')}
          </button>
        </div>
      )}
    </div>
  )
}
