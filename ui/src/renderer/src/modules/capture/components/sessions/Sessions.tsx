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

export default function Sessions() {
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

  useEffect(() => {
    window.capture.onReloadSessions(() => {
      fetchSessions(selectedProject, selectedParticipant)
    })

    fetchSessions(selectedProject, selectedParticipant)
    return () => {
      window.capture.removeReloadSessionsListeners()
    }
  }, [selectedProject, selectedParticipant])

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Sessions</ElementTitle>
      </ElementHeader>
      <ElementList>
        {sessions.map((session) => (
          <ElementListItem
            key={session.session_id}
            label={formatDatetime(session.started_at)}
            showActions={{ info: true, delete: true }}
            onInfo={() => openSessionInfo(session)}
            onDelete={() => handleDelete(session)}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
