import Input from "@renderer/core/components/input/Input"
import styles from "./update-project.module.css"
import Button from "@renderer/core/components/button/Button"
import { AxiosError } from "axios"
import { Await, useAsyncError, useParams } from "react-router"
import { Suspense } from "react"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import projectService from "../../services/ProjectService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"

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
      await projectService.update(projectName, project)
      window.organization.reloadProjects()
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

  return (
    <main className={styles.page}>
      <section className={styles.top}>
        <EditIcon className={styles.icon} />
        <h2 className={styles.title}>Update project</h2>
      </section>
      <hr className={styles.line} />
      <Suspense>
        <Await resolve={fetchProject(projectName)} errorElement={<ErrorElement name="Project" />}>
          {(project) => (
            <>
              <form id="update" className={styles.form} onSubmit={handleSubmit}>
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
              </form>
              <section className={styles.buttons}>
                <Button type="submit" form="update">
                  UPDATE
                </Button>
                <Button styleType="danger" onClick={closeModalWindow}>
                  CLOSE
                </Button>
              </section>
            </>
          )}
        </Await>
      </Suspense>
    </main>
  )
}
