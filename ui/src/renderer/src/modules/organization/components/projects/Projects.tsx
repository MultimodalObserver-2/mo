import { useEffect, useState } from "react"
import styles from "./projects.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { Project } from "../../types/Project"
import projectService from "../../services/ProjectService"

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])

  const handleOnCreate = () => {
    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Create Project" },
      "organization/create-project"
    )
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getAll()
        setProjects(response.data)
      } catch {
        alert("Error: an unexpected error occurred, please relaunch the app")
        setProjects([])
      }
    }

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
            {project.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
