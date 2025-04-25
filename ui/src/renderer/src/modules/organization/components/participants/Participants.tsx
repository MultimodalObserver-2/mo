import styles from "./participants.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import { useDispatch, useSelector } from "react-redux"
import { useCallback, useEffect, useState } from "react"
import participantService from "../../services/ParticipantService"
import { Participant } from "../../types/Participant"
import ElementList from "@renderer/core/components/panel/panel-element/element-list/ElementList"
import ElementListItem from "@renderer/core/components/panel/panel-element/element-list/ElementListItem"
import { selectSelectedProject } from "../../store/projectsSlice"
import {
  clearSelectedParticipant,
  selectSelectedParticipant,
  setSelectedParticipant
} from "../../store/participantsSlice"
import { MessageBoxOptions } from "electron"
import { AxiosError } from "axios"

export default function Participants() {
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const dispatch = useDispatch()
  const [participants, setParticipants] = useState<Participant[]>([])

  const fetchParticipants = useCallback(
    async (project) => {
      if (!project) {
        dispatch(clearSelectedParticipant())
        setParticipants([])
        return
      }

      try {
        const response = await participantService.getAll(project.name)
        setParticipants(response.data)
      } catch {
        window.core.dialog.showErrorBox(
          "Error",
          "An unexpected error occurred, please relaunch the app"
        )
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
      window.core.dialog.showErrorBox("Add error", "Please select a project first")
      return
    }

    window.core.openModalWindow(
      { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Add Participant" },
      `organization/${selectedProject?.name}/add-participant`
    )
  }

  const handleEdit = (participant: Participant) => {
    if (participant.locked) {
      window.core.dialog.showErrorBox(
        "Edit error",
        "You cannot edit a locked participant, please unlock it first"
      )
      return
    }

    window.core.openModalWindow(
      { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Update Participant" },
      `organization/${selectedProject?.name}/update-participant/${participant.code}`
    )
  }

  const handleDelete = async (participant: Participant) => {
    if (!selectedProject) return

    if (participant.locked) {
      window.core.dialog.showErrorBox(
        "Delete error",
        "You cannot delete a locked participant, please unlock it first"
      )
      return
    }

    const buttons = ["Accept", "Cancel"]
    const acceptId = 0
    const cancelId = 1
    const options: MessageBoxOptions = {
      title: "Delete Participant",
      message:
        `Are you sure you want to delete the participant ${participant.name}` +
        ` (code: ${participant.code}) from the project ${selectedProject?.name}?` +
        `\nThis will delete all data related to this participant`,
      type: "warning",
      buttons: buttons,
      defaultId: acceptId,
      cancelId: cancelId,
      noLink: true
    }

    const response = await window.core.dialog.showMessageBox(options)
    if (response.response === acceptId) {
      try {
        await participantService.delete(selectedProject?.name, participant.code)
        await fetchParticipants(selectedProject)
      } catch (error) {
        let errorMessage = "An unexpected error occurred"
        if (error instanceof AxiosError && error.response && error.response.data.detail) {
          errorMessage = error.response.data.detail
        }
        window.core.dialog.showErrorBox("Delete error", errorMessage)
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
      window.core.dialog.showErrorBox("Lock error", "An unexpected error occurred")
    }
  }

  const handleInfo = (participant: Participant) => {
    window.core.openModalWindow(
      { width: 720, height: 510, minWidth: 650, minHeight: 500, title: "Participant Information" },
      `organization/${selectedProject?.name}/participants/${participant.code}`
    )
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
