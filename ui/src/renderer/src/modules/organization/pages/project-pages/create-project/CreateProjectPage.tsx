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
import { useTranslation } from "react-i18next"

export default function CreateProjectPage() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.createProject" })
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
        <ModalTitle title={t("title")} Icon={CreateFolderIcon} />
      </ModalHeader>
      <ModalBody type="form" id="create" onSubmit={handleSubmit}>
        <Input
          label={t("name_label")}
          id="name"
          required
          placeholder={t("name_placeholder")}
          type="text"
        />
        <Input
          label={t("description_label")}
          id="description"
          placeholder={t("description_placeholder")}
          type="text"
        />
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
