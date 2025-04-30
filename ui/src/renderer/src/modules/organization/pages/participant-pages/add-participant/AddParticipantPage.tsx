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

export default function AddParticipantPage() {
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
        <ModalTitle title="New Participant" Icon={PersonAddIcon} />
      </ModalHeader>
      <ModalBody type="form" id="create" onSubmit={addParticipant}>
        <Input
          label="Code"
          id="code"
          required
          placeholder="Enter the participant's identification code"
          type="text"
        />
        <Input
          label="Name"
          id="name"
          required
          placeholder="Enter the participant's name"
          type="text"
        />
        <ListInput label="Notes" name="notes" placeholder="Enter notes about the participant" />
      </ModalBody>
      <ModalFooter>
        <Button type="submit" form="create">
          CREATE
        </Button>
        <Button styleType="danger" onClick={closeModalWindow}>
          CLOSE
        </Button>
      </ModalFooter>
    </PageModal>
  )
}
