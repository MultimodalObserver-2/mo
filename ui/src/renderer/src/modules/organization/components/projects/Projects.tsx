import { useEffect, useState } from "react"
import styles from "./projects.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { Project } from "../../types/Project"
import projectService from "../../services/ProjectService"
import { MessageBoxOptions } from "electron"
import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import {
  ElementActions,
  ElementHeader,
  ElementTitle
} from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import {
  ElementList,
  ElementListItem
} from "@renderer/core/components/panel/panel-element/element-list/ElementList"

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

  const handleShowInfo = (project: Project) => {
    window.core.openModalWindow(
      { width: 720, height: 430, minWidth: 650, minHeight: 430, title: "Project Information" },
      `organization/projects/${project.name}`
    )
  }

  useEffect(() => {
    window.organization.onReloadProjects(() => {
      fetchProjects()
    })

    fetchProjects()
  }, [])

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Projects</ElementTitle>
        <ElementActions>
          <button className={styles["add-button"]} onClick={handleOnCreate}>
            <AddCircleIcon className={styles.svg} />
          </button>
        </ElementActions>
      </ElementHeader>
      <ElementList>
        {projects.map((project) => (
          <ElementListItem
            key={project.name}
            label={project.name}
            showActions={true}
            onInfo={() => handleShowInfo(project)}
            onEdit={() => handleEdit(project)}
            onDelete={() => {
              handleDelete(project)
            }}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
