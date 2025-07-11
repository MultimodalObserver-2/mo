import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import PersonAddIcon from "@renderer/core/components/icons/PersonAddIcon"
import { useParams } from "react-router"
import ListInput from "@renderer/core/components/list-input/ListInput"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { showSelectProjectErrorMessage } from "@renderer/modules/organization/utils/dialogMessages"
import participantService from "@renderer/modules/organization/services/ParticipantService"
import { useTranslation } from "react-i18next"

export default function AddParticipantPage() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.addParticipant" })
  const { projectName } = useParams<{ projectName: string }>()
  if (!projectName) {
    showSelectProjectErrorMessage()
    window.close()
    return null
  }

  const closeModalWindow = () => {
    window.close()
  }

  const addParticipant = async (e) => {
    e.preventDefault()

    const newParticipant = {
      code: e.target.code.value,
      name: e.target.name.value,
      notes: JSON.parse(e.target.notes.value)
    }

    try {
      await participantService.create(projectName, newParticipant)
      window.organization.reloadParticipants()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title={t("title")} Icon={PersonAddIcon} />
      </ModalHeader>
      <ModalBody type="form" id="create" onSubmit={addParticipant}>
        <Input
          label={t("code_label")}
          id="code"
          required
          placeholder={t("code_placeholder")}
          type="text"
        />
        <Input
          label={t("name_label")}
          id="name"
          required
          placeholder={t("name_placeholder")}
          type="text"
        />
        <ListInput label={t("notes_label")} name="notes" placeholder={t("notes_placeholder")} />
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="create">
          {t("create_button").toUpperCase()}
        </Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          {t("close_button").toUpperCase()}
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
