import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import { AxiosError } from "axios"
import { Await, useParams } from "react-router"
import { Suspense } from "react"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import projectService from "../../services/ProjectService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"

export default function UpdateProjectPage() {
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
      let errorMessage = error as string
      if (error instanceof AxiosError && error.response && error.response.data.detail) {
        errorMessage = error.response.data.detail
      }
      window.core.dialog.showErrorBox("Project update error", errorMessage)
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
        <ModalTitle title="Update project" Icon={EditIcon} />
      </ModalHeader>
      <ModalBody type="form" id="update" onSubmit={handleSubmit}>
        <Suspense>
          <Await resolve={projectPromise} errorElement={<ErrorElement name="Project" />}>
            {(project) => (
              <>
                <Input
                  label="Name"
                  id="name"
                  required
                  placeholder="Enter the project name"
                  defaultValue={project.name}
                  type="text"
                />
                <Input
                  label="Description"
                  id="description"
                  placeholder="Enter the project description"
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
