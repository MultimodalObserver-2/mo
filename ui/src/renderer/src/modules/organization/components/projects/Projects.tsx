import { useEffect, useState } from "react"
import styles from "./projects.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { Project } from "../../types/Project"
import projectService from "../../services/ProjectService"
import { MessageBoxOptions } from "electron"
import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import ElementList from "@renderer/core/components/panel/panel-element/element-list/ElementList"
import ElementListItem from "@renderer/core/components/panel/panel-element/element-list/ElementListItem"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import { AxiosError } from "axios"
import { useDispatch, useSelector } from "react-redux"
import {
  clearSelectedProject,
  selectSelectedProject,
  setSelectedProject
} from "../../store/projectsSlice"
import { clearSelectedParticipant } from "../../store/participantsSlice"

export default function Projects() {
  const selectedProject = useSelector(selectSelectedProject)
  const dispatch = useDispatch()
  const [projects, setProjects] = useState<Project[]>([])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll()
      setProjects(response.data)
    } catch {
      window.core.dialog.showErrorBox(
        "Error",
        "An unexpected error occurred, please relaunch the app"
      )
      setProjects([])
    }
  }

  const handleCreate = () => {
    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Create Project" },
      "organization/create-project"
    )
  }

  const handleEdit = (project: Project) => {
    if (project.locked) {
      window.core.dialog.showErrorBox(
        "Edit error",
        "You cannot edit a locked project, please unlock it first"
      )
      return
    }

    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Update Project" },
      `organization/update-project/${project.name}`
    )
  }

  const handleDelete = async (project: Project) => {
    if (project.locked) {
      window.core.dialog.showErrorBox(
        "Delete error",
        "You cannot delete a locked project, please unlock it first"
      )
      return
    }

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
        dispatch(clearSelectedProject())
      } catch (error) {
        let errorMessage = "An unexpected error occurred"
        if (error instanceof AxiosError && error.response && error.response.data.detail) {
          errorMessage = error.response.data.detail
        }
        window.core.dialog.showErrorBox("Delete error", errorMessage)
      }
    }
  }

  const handleShowInfo = (project: Project) => {
    window.core.openModalWindow(
      { width: 720, height: 430, minWidth: 650, minHeight: 430, title: "Project Information" },
      `organization/projects/${project.name}`
    )
  }

  const handleLock = async (project: Project) => {
    try {
      if (project.locked) {
        await projectService.unlock(project.name)
      } else {
        await projectService.lock(project.name)
      }

      await fetchProjects()
    } catch {
      window.core.dialog.showErrorBox("Lock error", "An unexpected error occurred")
    }
  }

  useEffect(() => {
    window.organization.onReloadProjects(() => {
      fetchProjects()
    })

    window.organization.onChangeSelectedProject((project) => {
      if (project) {
        dispatch(setSelectedProject(project))
      } else {
        dispatch(clearSelectedProject())
        dispatch(clearSelectedParticipant())
      }
    })

    fetchProjects()
  }, [dispatch])

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Projects</ElementTitle>
        <ElementActions>
          <button className={styles["add-button"]} onClick={handleCreate}>
            <AddCircleIcon className={styles.svg} />
          </button>
        </ElementActions>
      </ElementHeader>
      <ElementList>
        {projects.map((project) => (
          <ElementListItem
            key={project.name}
            label={project.name}
            isLocked={project.locked}
            isSelected={project.name === selectedProject?.name}
            showActions={true}
            onClick={() => {
              if (selectedProject?.name !== project.name) {
                dispatch(setSelectedProject(project))
                dispatch(clearSelectedParticipant())
              }
            }}
            onInfo={() => handleShowInfo(project)}
            onLock={() => handleLock(project)}
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
