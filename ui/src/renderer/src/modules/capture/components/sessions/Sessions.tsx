import { useTranslation } from "react-i18next"
import styles from "./sessions.module.css"
import {
  ElementHeader,
  ElementList,
  ElementListItem,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"
import { selectSelectedParticipant } from "@renderer/modules/organization/store/participantsSlice"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { CaptureSession } from "../../types/Session"
import sessionService from "../../services/SessionService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { Project } from "@renderer/modules/organization/types/Project"
import { Participant } from "@renderer/modules/organization/types/Participant"
import { formatDatetime } from "../../utils/helpers"
import { openSessionDetailsModal } from "../../utils/modalWindows"
import { showDeleteSessionMessage } from "../../utils/dialogMessages"
import ShowDuration from "../show-duration/ShowDuration"
import sessionRegistry, { SessionAction } from "../../store/SessionRegistry"

export default function Sessions() {
  const { t } = useTranslation("capture", { keyPrefix: "components.sessions" })
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const [sessions, setSessions] = useState<CaptureSession[]>([])

  const fetchSessions = async (project: Project | null, participant: Participant | null) => {
    if (!project || !participant) {
      setSessions([])
      return
    }
    try {
      const response = await sessionService.getAll(project.name, participant.code)
      setSessions(response.data)
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const openSessionInfo = (session: CaptureSession) => {
    if (!selectedProject || !selectedParticipant) {
      return
    }
    openSessionDetailsModal(selectedProject.name, selectedParticipant.code, session.session_id)
  }

  const handleDelete = async (session: CaptureSession) => {
    if (!selectedProject || !selectedParticipant) {
      return
    }
    const acceptId = 0
    const response = await showDeleteSessionMessage(
      session.session_id,
      selectedProject.name,
      selectedParticipant.code,
      acceptId
    )
    if (response.response === acceptId) {
      try {
        await sessionService.delete(
          selectedProject.name,
          selectedParticipant.code,
          session.session_id
        )
        setSessions((prevSessions) =>
          prevSessions.filter((s) => s.session_id !== session.session_id)
        )
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  const handleExtraActionOnClick = (action: SessionAction, session: CaptureSession) => {
    if (!selectedProject || !selectedParticipant) {
      return
    }
    action.onClick(selectedProject, selectedParticipant, session)
  }

  useEffect(() => {
    const removeListener = window.capture.onReloadSessions(() => {
      fetchSessions(selectedProject, selectedParticipant)
    })

    fetchSessions(selectedProject, selectedParticipant)
    return () => {
      removeListener()
    }
  }, [selectedProject, selectedParticipant])

  return (
    <PanelElement className={styles["sessions-panel"]}>
      <ElementHeader>
        <ElementTitle>{t("title")}</ElementTitle>
      </ElementHeader>
      <ElementList>
        {sessions.map((session) => (
          <ElementListItem
            key={session.session_id}
            leftElement={<ShowDuration duration={session.duration} />}
            label={formatDatetime(session.started_at)}
            showActions={{ info: true, delete: true }}
            onInfo={() => openSessionInfo(session)}
            onDelete={() => handleDelete(session)}
            extraActions={
              <>
                {sessionRegistry.getActions().map((action) => {
                  const ActionElement = action.element
                  return (
                    <ActionElement
                      key={action.id}
                      className={styles["session-action"]}
                      onClick={() => handleExtraActionOnClick(action, session)}
                    />
                  )
                })}
              </>
            }
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
