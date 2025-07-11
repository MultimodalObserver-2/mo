import { useTranslation } from "react-i18next"
import styles from "./sessions-list.module.css"
import { useEffect, useState } from "react"
import {
  ElementActions,
  ElementHeader,
  ElementList,
  ElementListItem,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"
import sessionService from "@renderer/modules/capture/services/SessionService"
import { CaptureSession } from "@renderer/modules/capture/types/Session"
import ShowDuration from "@renderer/modules/capture/components/show-duration/ShowDuration"
import { formatDatetime } from "@renderer/modules/capture/utils/helpers"
import { openSessionDetailsModal } from "@renderer/modules/capture/utils/modalWindows"
import { showDeleteSessionMessage } from "@renderer/modules/capture/utils/dialogMessages"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import CloseIcon from "@renderer/core/components/icons/CloseIcon"

interface SessionsListProps {
  readonly projectName: string
  readonly participantCode: string
  readonly selectedSession: CaptureSession
  readonly onSessionSelected: (session: CaptureSession | null) => void
  readonly onClose?: () => void
  readonly visible?: boolean
}

export default function SessionsList({
  projectName,
  participantCode,
  selectedSession,
  onSessionSelected,
  onClose = () => {},
  visible = true
}: SessionsListProps) {
  const { t } = useTranslation("visualization", { keyPrefix: "components.sessionsList" })
  const [sessions, setSessions] = useState<CaptureSession[]>([])

  const fetchSessions = async (prName: string, parCode: string) => {
    try {
      const response = await sessionService.getSorted(prName, parCode, true, true)
      setSessions(response)
    } catch (error) {
      setSessions([])
      showApiErrorMessage(error)
    }
  }

  useEffect(() => {
    const removeListener = window.capture.onReloadSessions(() => {
      fetchSessions(projectName, participantCode)
    })
    fetchSessions(projectName, participantCode)
    return () => {
      removeListener()
    }
  }, [projectName, participantCode])

  const openSessionInfo = (session: CaptureSession) => {
    openSessionDetailsModal(projectName, participantCode, session.session_id)
  }

  const handleDelete = async (session: CaptureSession) => {
    const acceptId = 0
    const response = await showDeleteSessionMessage(
      session.session_id,
      projectName,
      participantCode,
      acceptId
    )
    if (response.response === acceptId) {
      try {
        await sessionService.delete(projectName, participantCode, session.session_id)
        setSessions((prevSessions) => {
          const newSessions = prevSessions.filter((s) => s.session_id !== session.session_id)
          const newSessionsSorted = newSessions.toSorted(
            (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
          )
          if (selectedSession?.session_id === session.session_id) {
            onSessionSelected(newSessionsSorted[0] || null)
          }

          return newSessionsSorted
        })
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  return (
    <PanelElement className={`${styles.container} ${visible ? styles.visible : ""}`}>
      <ElementHeader className={styles.header}>
        <ElementTitle className={styles.title}>
          <span>{t("availableSessions")}</span>
          <p className={styles["help-text"]}>{t("selectSessionForPlayback")}</p>
        </ElementTitle>
        <ElementActions>
          <CloseIcon className={styles.close} onClick={onClose} />
        </ElementActions>
      </ElementHeader>
      <ElementList className={styles.sessions}>
        {sessions.map((session) => (
          <ElementListItem
            key={session.session_id}
            leftElement={<ShowDuration duration={session.duration} />}
            label={formatDatetime(session.started_at)}
            showActions={{ info: true, delete: true }}
            onInfo={(e) => {
              e.stopPropagation()
              openSessionInfo(session)
            }}
            onDelete={(e) => {
              e.stopPropagation()
              handleDelete(session)
            }}
            onClick={() => onSessionSelected(session)}
            isSelected={selectedSession?.session_id === session.session_id}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
