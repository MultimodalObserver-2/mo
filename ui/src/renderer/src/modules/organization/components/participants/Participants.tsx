import styles from "./participants.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import {
  ElementActions,
  ElementHeader,
  ElementList,
  ElementListItem,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"
import { useDispatch, useSelector } from "react-redux"
import { useCallback, useEffect, useState } from "react"
import participantService from "../../services/ParticipantService"
import { Participant } from "../../types/Participant"
import { selectSelectedProject } from "../../store/projectsSlice"
import {
  clearSelectedParticipant,
  selectSelectedParticipant,
  setSelectedParticipant
} from "../../store/participantsSlice"
import { Project } from "../../types/Project"
import {
  showApiErrorMessage,
  showLockedErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import {
  openAddParticipantModal,
  openParticipantInfoModal,
  openUpdateParticipantModal
} from "../../utils/modalWindows"
import {
  showDeleteParticipantMessage,
  showSelectProjectErrorMessage
} from "../../utils/dialogMessages"

export default function Participants() {
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const dispatch = useDispatch()
  const [participants, setParticipants] = useState<Participant[]>([])

  const fetchParticipants = useCallback(
    async (project: Project | null) => {
      if (!project) {
        dispatch(clearSelectedParticipant())
        setParticipants([])
        return
      }

      try {
        const response = await participantService.getAll(project.name)
        setParticipants(response.data)
      } catch {
        showUnexpectedErrorMessage()
        dispatch(clearSelectedParticipant())
        setParticipants([])
      }
    },
    [dispatch]
  )

  useEffect(() => {
    window.organization.onChangeSelectedParticipant((participant) => {
      if (participant) {
        dispatch(setSelectedParticipant(participant))
      } else {
        dispatch(clearSelectedParticipant())
      }
    })
  }, [dispatch])

  useEffect(() => {
    window.organization.onReloadParticipants(() => {
      fetchParticipants(selectedProject)
    })

    fetchParticipants(selectedProject)
    return () => {
      window.organization.removeReloadParticipants()
    }
  }, [selectedProject, fetchParticipants])

  const handleAdd = () => {
    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    openAddParticipantModal(selectedProject.name)
  }

  const handleEdit = (participant: Participant) => {
    if (participant.locked) {
      showLockedErrorMessage("edit", "participant")
      return
    }

    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    openUpdateParticipantModal(selectedProject?.name, participant.code)
  }

  const handleDelete = async (participant: Participant) => {
    if (!selectedProject) return

    if (participant.locked) {
      showLockedErrorMessage("delete", "participant")
      return
    }

    const acceptId = 0
    const cancelId = 1

    const response = await showDeleteParticipantMessage(
      participant.name,
      participant.code,
      selectedProject.name,
      acceptId,
      cancelId
    )
    if (response.response === acceptId) {
      try {
        await participantService.delete(selectedProject?.name, participant.code)
        await fetchParticipants(selectedProject)
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  const handleLock = async (participant: Participant) => {
    if (!selectedProject) return

    try {
      if (participant.locked) {
        await participantService.unlock(selectedProject.name, participant.code)
      } else {
        await participantService.lock(selectedProject.name, participant.code)
      }

      await fetchParticipants(selectedProject)
    } catch {
      showUnexpectedErrorMessage()
    }
  }

  const handleInfo = (participant: Participant) => {
    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    openParticipantInfoModal(selectedProject?.name, participant.code)
  }

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Participants</ElementTitle>
        <ElementActions>
          {selectedProject && (
            <button className={styles["add-button"]} onClick={handleAdd}>
              <AddCircleIcon className={styles.svg} />
            </button>
          )}
        </ElementActions>
      </ElementHeader>
      <ElementList>
        {participants.map((participant) => (
          <ElementListItem
            key={participant.code}
            label={`[${participant.code}] ${participant.name}`}
            isLocked={participant.locked}
            isSelected={participant.code === selectedParticipant?.code}
            showActions={true}
            onClick={() => dispatch(setSelectedParticipant(participant))}
            onInfo={() => handleInfo(participant)}
            onLock={() => handleLock(participant)}
            onEdit={() => handleEdit(participant)}
            onDelete={() => handleDelete(participant)}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
