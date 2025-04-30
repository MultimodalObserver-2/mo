import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import CreateFolderIcon from "@renderer/core/components/icons/CreateFolderIcon"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import projectService from "@renderer/modules/organization/services/ProjectService"

export default function CreateProjectPage() {
  const handleSubmit = async (e) => {
    e.preventDefault()
    const newProject = {
      name: e.target.name.value,
      description: e.target.description.value
    }
    try {
      await projectService.create(newProject)
      window.organization.reloadProjects()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="New Project" Icon={CreateFolderIcon} />
      </ModalHeader>
      <ModalBody type="form" id="create" onSubmit={handleSubmit}>
        <Input label="Name" id="name" required placeholder="Enter the project name" type="text" />
        <Input
          label="Description"
          id="description"
          placeholder="Enter the project description"
          type="text"
        />
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
