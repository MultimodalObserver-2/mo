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
import {
  showApiErrorMessage,
  showLockedErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import { showDeleteParticipantMessage } from "../../utils/dialogMessages"
import { openUpdateParticipantModal } from "../../utils/modalWindows"

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
      showLockedErrorMessage("delete", "participant")
      return
    }

    const acceptId = 0
    const cancelId = 1
    const response = await showDeleteParticipantMessage(
      participant.name,
      participant.code,
      projectName,
      acceptId,
      cancelId
    )
    if (response.response === acceptId) {
      try {
        await participantService.delete(projectName, participant.code)
        window.organization.reloadParticipants()
        window.organization.changeSelectedParticipant(null)
        window.close()
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  const handleEdit = (participant: Participant) => {
    if (participant.locked) {
      showLockedErrorMessage("edit", "participant")
      return
    }

    if (!projectName) {
      return
    }

    openUpdateParticipantModal(projectName, participant.code)
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
      showUnexpectedErrorMessage()
    }
  }

  useEffect(() => {
    async function fetchParticipant(
      projectName: string | undefined,
      participantCode: string | undefined
    ) {
      if (!projectName || !participantCode) {
        showUnexpectedErrorMessage()
        window.close()
        return
      }

      try {
        const response = await participantService.get(projectName, participantCode)
        setParticipant(response.data)
      } catch (error) {
        showApiErrorMessage(error)
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
