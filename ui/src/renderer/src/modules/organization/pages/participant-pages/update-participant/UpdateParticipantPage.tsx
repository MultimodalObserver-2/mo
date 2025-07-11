import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import { Await, useParams } from "react-router"
import ListInput from "@renderer/core/components/list-input/ListInput"
import { Suspense } from "react"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"

import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import {
  showParticipantCodeErrorMessage,
  showSelectProjectErrorMessage
} from "@renderer/modules/organization/utils/dialogMessages"
import participantService from "@renderer/modules/organization/services/ParticipantService"
import { useTranslation } from "react-i18next"

export default function UpdateParticipantPage() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.updateParticipant" })
  const { projectName, participantCode } = useParams<{
    projectName: string
    participantCode: string
  }>()

  if (!projectName) {
    showSelectProjectErrorMessage()
    window.close()
    return null
  }

  if (!participantCode) {
    showParticipantCodeErrorMessage()
    window.close()
    return null
  }

  const closeModalWindow = () => {
    window.close()
  }

  const updateParticipant = async (e) => {
    e.preventDefault()

    const participant = {
      code: e.target.code.value,
      name: e.target.name.value,
      notes: JSON.parse(e.target.notes.value)
    }

    try {
      const response = await participantService.update(projectName, participantCode, participant)
      window.organization.reloadParticipants()
      if (participantCode !== participant.code) {
        window.organization.changeSelectedParticipant(response.data)
      }

      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  async function fetchParticipant(projectName: string, participantCode: string) {
    const response = await participantService.get(projectName, participantCode)
    return response.data
  }

  const participantPromise = fetchParticipant(projectName, participantCode)

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title={t("title")} Icon={EditIcon} />
      </ModalHeader>
      <ModalBody type="form" id="update" onSubmit={updateParticipant}>
        <Suspense>
          <Await resolve={participantPromise} errorElement={<ErrorElement name="Participant" />}>
            {(participant) => (
              <>
                <Input
                  label={t("code_label")}
                  id="code"
                  required
                  placeholder={t("code_placeholder")}
                  defaultValue={participant.code}
                  type="text"
                />
                <Input
                  label={t("name_label")}
                  id="name"
                  required
                  placeholder={t("name_placeholder")}
                  defaultValue={participant.name}
                  type="text"
                />
                <ListInput
                  label={t("notes_label")}
                  name="notes"
                  placeholder={t("notes_placeholder")}
                  defaultValue={participant.notes}
                />
              </>
            )}
          </Await>
        </Suspense>
      </ModalBody>
      <ModalFooter>
        <Suspense>
          <Await resolve={participantPromise} errorElement={<ErrorElement name="Participant" />}>
            {() => (
              <>
                <Button type="submit" form="update">
                  {t("update_button").toUpperCase()}
                </Button>
                <Button styleType="danger" onClick={closeModalWindow}>
                  {t("close_button").toUpperCase()}
                </Button>
              </>
            )}
          </Await>
        </Suspense>
      </ModalFooter>
    </PageModal>
  )
}
