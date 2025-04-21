import styles from "./create-project.module.css"
import { AxiosError } from "axios"
import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import CreateFolderIcon from "@renderer/core/components/icons/CreateFolderIcon"
import projectService from "../../services/ProjectService"

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
      let errorMessage = error
      if (error instanceof AxiosError && error.response && error.response.data.detail) {
        errorMessage = error.response.data.detail
      }
      alert("Error: " + errorMessage)
    }
  }

  const handleClose = () => {
    window.close()
  }

  return (
    <main className={styles.page}>
      <section className={styles.top}>
        <CreateFolderIcon className={styles.icon} />
        <h2 className={styles.title}>New Project</h2>
      </section>
      <hr className={styles.line} />
      <form id="create" className={styles.form} onSubmit={handleSubmit}>
        <Input label="Name" id="name" required placeholder="Enter the project name" type="text" />
        <Input
          label="Description"
          id="description"
          placeholder="Enter the project description"
          type="text"
        />
      </form>
      <section className={styles.buttons}>
        <Button type="submit" form="create">
          CREATE
        </Button>
        <Button styleType="danger" onClick={handleClose}>
          CLOSE
        </Button>
      </section>
    </main>
  )
}
