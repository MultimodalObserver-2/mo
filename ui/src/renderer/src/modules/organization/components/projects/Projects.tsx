import { useEffect, useState } from "react"
import styles from "./projects.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { Project } from "../../types/Project"
import projectService from "../../services/ProjectService"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import { MessageBoxOptions } from "electron"

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll()
      setProjects(response.data)
    } catch {
      alert("Error: an unexpected error occurred, please relaunch the app")
      setProjects([])
    }
  }

  const handleOnCreate = () => {
    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Create Project" },
      "organization/create-project"
    )
  }

  const handleEdit = (project: Project) => {
    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Update Project" },
      `organization/update-project/${project.name}`
    )
  }

  const handleDelete = async (project: Project) => {
    const buttons = ["Accept", "Cancel"]
    const acceptId = 0
    const cancelId = 1
    const options: MessageBoxOptions = {
      title: "Delete Project",
      message: `Are you sure you want to delete the project ${project.name}?, this will delete all the data related to this project`,
      type: "warning",
      buttons: buttons,
      defaultId: acceptId,
      cancelId: cancelId,
      noLink: true
    }

    const response = await window.core.dialog.showMessageBox(options)
    if (response.response === acceptId) {
      try {
        await projectService.delete(project.name)
        await fetchProjects()
      } catch {
        window.core.dialog.showErrorBox("Delete Error", "An unexpected error occurred")
      }
    }
  }

  useEffect(() => {
    window.organization.onReloadProjects(() => {
      fetchProjects()
    })

    fetchProjects()
  }, [])

  return (
    <div className={styles.box}>
      <section className={styles.top}>
        <h2 className={styles.title}>Projects</h2>
        <button className={styles["add-button"]} onClick={handleOnCreate}>
          <AddCircleIcon className={styles.svg} />
        </button>
      </section>
      <ul className={styles.items}>
        {projects.map((project) => (
          <li className={styles.item} key={project.name} tabIndex={0}>
            <h4 className={styles.name}>{project.name}</h4>
            <div className={styles.actions}>
              <EditIcon
                className={`${styles.action} ${styles.normal}`}
                onClick={() => handleEdit(project)}
              />
              <DeleteIcon
                className={`${styles.action} ${styles.danger}`}
                onClick={() => {
                  handleDelete(project)
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
