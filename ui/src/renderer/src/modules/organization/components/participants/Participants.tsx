import styles from "./participants.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import { useDispatch, useSelector } from "react-redux"
import { useEffect, useState } from "react"
import participantService from "../../services/ParticipantService"
import { Participant } from "../../types/Participant"
import ElementList from "@renderer/core/components/panel/panel-element/element-list/ElementList"
import ElementListItem from "@renderer/core/components/panel/panel-element/element-list/ElementListItem"
import { selectSelectedProject } from "../../store/projectsSlice"
import { selectSelectedParticipant, setSelectedParticipant } from "../../store/participantsSlice"
import { MessageBoxOptions } from "electron"
import { AxiosError } from "axios"

export default function Participants() {
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const dispatch = useDispatch()
  const [participants, setParticipants] = useState<Participant[]>([])

  const fetchParticipants = async (project) => {
    if (!project) {
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
      setParticipants([])
    }
  }

  useEffect(() => {
    window.organization.onReloadParticipants(() => {
      fetchParticipants(selectedProject)
    })

    fetchParticipants(selectedProject)
    return () => {
      window.organization.removeReloadParticipants()
    }
  }, [selectedProject])

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
    window.core.openModalWindow(
      { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Update Participant" },
      `organization/${selectedProject?.name}/update-participant/${participant.code}`
    )
  }

  const handleDelete = async (participant: Participant) => {
    if (!selectedProject) {
      return
    }

    const buttons = ["Accept", "Cancel"]
    const acceptId = 0
    const cancelId = 1
    const options: MessageBoxOptions = {
      title: "Delete Project",
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
            showActions={{ info: false, lock: false, edit: true, delete: true }}
            onClick={() => dispatch(setSelectedParticipant(participant))}
            onEdit={() => handleEdit(participant)}
            onDelete={() => handleDelete(participant)}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
