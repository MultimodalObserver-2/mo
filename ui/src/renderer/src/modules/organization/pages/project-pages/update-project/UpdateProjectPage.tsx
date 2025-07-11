import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import { Await, useParams } from "react-router"
import { Suspense } from "react"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import projectService from "@renderer/modules/organization/services/ProjectService"
import { useTranslation } from "react-i18next"

export default function UpdateProjectPage() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.updateProject" })
  const { projectName } = useParams<{ projectName: string }>()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const project = {
      name: e.target.name.value,
      description: e.target.description.value
    }

    if (!projectName) return

    try {
      const response = await projectService.update(projectName, project)
      window.organization.reloadProjects()
      if (projectName !== project.name) {
        window.organization.changeSelectedProject(response.data)
      }
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  async function fetchProject(projectName: string | undefined) {
    if (!projectName) {
      throw new Error("No project name declared")
    }

    const response = await projectService.get(projectName)
    return response.data
  }

  const projectPromise = fetchProject(projectName)

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title={t("title")} Icon={EditIcon} />
      </ModalHeader>
      <ModalBody type="form" id="update" onSubmit={handleSubmit}>
        <Suspense>
          <Await resolve={projectPromise} errorElement={<ErrorElement name="Project" />}>
            {(project) => (
              <>
                <Input
                  label={t("name_label")}
                  id="name"
                  required
                  placeholder={t("name_placeholder")}
                  defaultValue={project.name}
                  type="text"
                />
                <Input
                  label={t("description_label")}
                  id="description"
                  placeholder={t("description_placeholder")}
                  defaultValue={project.description}
                  type="text"
                />
              </>
            )}
          </Await>
        </Suspense>
      </ModalBody>
      <ModalFooter>
        <Suspense>
          <Await resolve={projectPromise} errorElement={<ErrorElement name="Project" />}>
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
