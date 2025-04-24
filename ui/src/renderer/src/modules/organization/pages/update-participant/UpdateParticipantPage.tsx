import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import { Await, useParams } from "react-router"
import { AxiosError } from "axios"
import participantService from "../../services/ParticipantService"
import ListInput from "@renderer/core/components/list-input/ListInput"
import { Suspense } from "react"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"

export default function UpdateParticipantPage() {
  const { projectName, participantCode } = useParams<{
    projectName: string
    participantCode: string
  }>()

  if (!projectName) {
    window.core.dialog.showErrorBox("Update error", "Please select a project first")
    window.close()
    return null
  }

  if (!participantCode) {
    window.core.dialog.showErrorBox("Update error", "Participant code error")
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
      await participantService.update(projectName, participantCode, participant)
      window.organization.reloadParticipants()
      window.close()
    } catch (error) {
      let errorMessage = error as string
      if (error instanceof AxiosError && error.response && error.response.data.detail) {
        errorMessage = error.response.data.detail
      }
      window.core.dialog.showErrorBox("Participant creation error", errorMessage)
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
        <ModalTitle title="New Participant" Icon={EditIcon} />
      </ModalHeader>
      <ModalBody type="form" id="update" onSubmit={updateParticipant}>
        <Suspense>
          <Await resolve={participantPromise} errorElement={<ErrorElement name="Participant" />}>
            {(participant) => (
              <>
                <Input
                  label="Code"
                  id="code"
                  required
                  placeholder="Enter the participant's identification code"
                  defaultValue={participant.code}
                  type="text"
                />
                <Input
                  label="Name"
                  id="name"
                  required
                  placeholder="Enter the participant's name"
                  defaultValue={participant.name}
                  type="text"
                />
                <ListInput
                  label="Notes"
                  name="notes"
                  placeholder="Enter notes about the participant"
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
                  UPDATE
                </Button>
                <Button styleType="danger" onClick={closeModalWindow}>
                  CLOSE
                </Button>
              </>
            )}
          </Await>
        </Suspense>
      </ModalFooter>
    </PageModal>
  )
}
