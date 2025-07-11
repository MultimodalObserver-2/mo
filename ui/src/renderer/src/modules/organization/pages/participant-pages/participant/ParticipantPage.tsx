import styles from "./participant.module.css"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import DisplayData from "@renderer/core/components/display-data/DisplayData"
import { useEffect, useState } from "react"
import { useParams } from "react-router"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import Button from "@renderer/core/components/button/Button"
import LockIcon from "@renderer/core/components/icons/LockIcon"
import LockOpenIcon from "@renderer/core/components/icons/LockOpenIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import {
  showApiErrorMessage,
  showLockedErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import { Participant } from "@renderer/modules/organization/types/Participant"
import { showDeleteParticipantMessage } from "@renderer/modules/organization/utils/dialogMessages"
import participantService from "@renderer/modules/organization/services/ParticipantService"
import { openUpdateParticipantModal } from "@renderer/modules/organization/utils/modalWindows"
import DisplayPath from "@renderer/core/components/display-path/DisplayPath"
import { useTranslation } from "react-i18next"

export default function ParticipantPage() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.participant" })
  const { projectName, participantCode } = useParams<{
    projectName: string
    participantCode: string
  }>()
  const [participant, setParticipant] = useState<Participant | null>(null)

  const handleDelete = async (participant: Participant) => {
    if (!projectName) {
      return
    }

    if (participant.locked) {
      showLockedErrorMessage(t("delete"), t("participant"))
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
      showLockedErrorMessage(t("edit"), t("participant"))
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
    return <ErrorElement name={t("participant")} />
  }

  return (
    <PageModal>
      <ModalHeader className={styles.header}>
        <div className={styles["title-box"]}>
          <ModalTitle title={t("title")} Icon={InfoIcon} />
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
      <ModalBody id="participant-info">
        <DisplayData name={t("code_label")} value={participant.code} />
        <DisplayData name={t("name_label")} value={participant.name} />
        <DisplayData
          name={t("notes_label")}
          value={participant.notes.length != 0 ? participant.notes : t("no_notes")}
        />
        <DisplayPath name={t("location_label")} value={participant.location} />
        <div className={styles.dates}>
          <DisplayData
            name={t("created_at_label")}
            value={new Date(participant.created_at).toLocaleDateString()}
          />
          <DisplayData
            name={t("updated_at_label")}
            value={new Date(participant.updated_at).toLocaleDateString()}
          />
        </div>
      </ModalBody>
    </PageModal>
  )
}
