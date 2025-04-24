import styles from "./participant.module.css"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import DisplayData from "@renderer/core/components/display-data/DisplayData"
import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router"
import participantService from "../../services/ParticipantService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import { Participant } from "../../types/Participant"
import Button from "@renderer/core/components/button/Button"
import ContentCopyIcon from "@renderer/core/components/icons/ContentCopyIcon"
import DocumentSearchIcon from "@renderer/core/components/icons/DocumentSearchIcon"
import LockIcon from "@renderer/core/components/icons/LockIcon"
import LockOpenIcon from "@renderer/core/components/icons/LockOpenIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"

export default function ParticipantPage() {
  const { projectName, participantCode } = useParams<{
    projectName: string
    participantCode: string
  }>()
  const copyMessage = useRef<HTMLSpanElement>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)

  const handleCopy = (text: string) => {
    window.core.clipboard.writeText(text)
    if (copyMessage.current) {
      copyMessage.current.style.opacity = "1"
      setTimeout(() => {
        if (copyMessage.current) {
          copyMessage.current.style.opacity = "0"
        }
      }, 1000)
    }
  }

  const handleOpenPath = (path: string) => {
    window.core.shell.openPath(path)
  }

  const handleDelete = async (participant: Participant) => {
    if (!projectName) {
      return
    }

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
    const options: Electron.MessageBoxOptions = {
      title: "Delete Participant",
      message:
        `Are you sure you want to delete the participant ${participant.name}` +
        ` (code: ${participant.code}) from the project ${projectName}?` +
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
        await participantService.delete(projectName, participant.code)
        window.organization.reloadParticipants()
        window.organization.changeSelectedParticipant(null)
        window.close()
      } catch {
        window.core.dialog.showErrorBox("Delete Error", "An unexpected error occurred")
      }
    }
  }

  const handleEdit = (participant: Participant) => {
    if (participant.locked) {
      window.core.dialog.showErrorBox(
        "Update error",
        "You cannot update a locked participant, please unlock it first"
      )
      return
    }

    window.core.openModalWindow(
      { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Update Participant" },
      `organization/${projectName}/update-participant/${participant.code}`
    )
  }

  const handleLock = async (participant: Participant) => {
    if (!projectName) {
      return
    }

    try {
      if (participant.locked) {
        await participantService.unlock(projectName, participant.code)
        setParticipant({ ...participant, locked: false })
      } else {
        await participantService.lock(projectName, participant.code)
        setParticipant({ ...participant, locked: true })
      }

      window.organization.reloadParticipants()
    } catch {
      window.core.dialog.showErrorBox("Lock error", "An unexpected error occurred")
    }
  }

  useEffect(() => {
    async function fetchParticipant(
      projectName: string | undefined,
      participantCode: string | undefined
    ) {
      if (!projectName || !participantCode) {
        window.core.dialog.showErrorBox(
          "Error",
          "An unexpected error occurred, please relaunch the app"
        )
        window.close()
        return
      }

      try {
        const response = await participantService.get(projectName, participantCode)
        setParticipant(response.data)
      } catch (error) {
        let errorMessage = "An unexpected error occurred"
        if (error instanceof Error) {
          errorMessage = error.message
        }
        window.core.dialog.showErrorBox("Participant error", errorMessage)
        window.close()
      }
    }

    fetchParticipant(projectName, participantCode)
  }, [projectName, participantCode])

  if (!participant) {
    return <ErrorElement name="Participant" />
  }

  return (
    <PageModal>
      <ModalHeader className={styles.header}>
        <div className={styles["title-box"]}>
          <ModalTitle title="Participant Information" Icon={InfoIcon} />
        </div>
        <div className={styles.actions}>
          <Button
            styleType="soft"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleLock(participant)}
          >
            {participant.locked ? (
              <LockIcon className={styles["action-icon"]} />
            ) : (
              <LockOpenIcon className={styles["action-icon"]} />
            )}
          </Button>
          <Button
            styleType="soft"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleEdit(participant)}
          >
            <EditIcon className={styles["action-icon"]} />
          </Button>
          <Button
            styleType="danger"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleDelete(participant)}
          >
            <DeleteIcon className={styles["action-icon"]} />
          </Button>
        </div>
      </ModalHeader>
      <ModalBody>
        <DisplayData name="Code" value={participant.code} />
        <DisplayData name="Name" value={participant.name} />
        <DisplayData
          name="Notes"
          value={participant.notes.length != 0 ? participant.notes : "No notes registered"}
        />
        <DisplayData
          name="Location"
          value={participant.location}
          childrenClass={styles["location-box"]}
        >
          <span className={styles["copy-container"]}>
            <Button
              className={styles["location-button"]}
              styleType="soft"
              onClick={() => handleCopy(participant.location)}
            >
              <ContentCopyIcon className={styles["button-icon"]} />
            </Button>
            <span ref={copyMessage} className={styles["copy-message"]}>
              Copied!
            </span>
          </span>
          <Button
            className={styles["location-button"]}
            styleType="soft"
            onClick={() => handleOpenPath(participant.location)}
          >
            <DocumentSearchIcon className={styles["button-icon"]} />
          </Button>
        </DisplayData>
        <div className={styles.dates}>
          <DisplayData
            name="Created At"
            value={new Date(participant.created_at).toLocaleDateString()}
          />
          <DisplayData
            name="Updated At"
            value={new Date(participant.updated_at).toLocaleDateString()}
          />
        </div>
      </ModalBody>
    </PageModal>
  )
}
