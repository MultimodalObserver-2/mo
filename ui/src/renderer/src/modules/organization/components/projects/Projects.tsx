import styles from "./projects.module.css"
import { useEffect, useState } from "react"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { Project } from "../../types/Project"
import projectService from "../../services/ProjectService"
import {
  ElementActions,
  ElementHeader,
  ElementList,
  ElementListItem,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"
import { useDispatch, useSelector } from "react-redux"
import {
  clearSelectedProject,
  selectSelectedProject,
  setSelectedProject
} from "../../store/projectsSlice"
import { clearSelectedParticipant } from "../../store/participantsSlice"
import {
  openCreateProjectModal,
  openProjectInfoModal,
  openUpdateProjectModal
} from "../../utils/modalWindows"
import { showDeleteProjectMessage } from "../../utils/dialogMessages"
import {
  showApiErrorMessage,
  showLockedErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import { clearSelectedProtocol } from "../../store/protocolsSlice"

export default function Projects() {
  const selectedProject = useSelector(selectSelectedProject)
  const dispatch = useDispatch()
  const [projects, setProjects] = useState<Project[]>([])

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll()
      setProjects(response.data)
    } catch {
      showUnexpectedErrorMessage()
      setProjects([])
    }
  }

  const handleEdit = (project: Project) => {
    if (project.locked) {
      showLockedErrorMessage("edit", "project")
      return
    }

    openUpdateProjectModal(project.name)
  }

  const handleDelete = async (project: Project) => {
    if (project.locked) {
      showLockedErrorMessage("delete", "project")
      return
    }

    const acceptId = 0
    const cancelId = 1
    const response = await showDeleteProjectMessage(project.name, acceptId, cancelId)
    if (response.response === acceptId) {
      try {
        await projectService.delete(project.name)
        await fetchProjects()
        dispatch(clearSelectedProject())
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
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
      showUnexpectedErrorMessage()
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
        dispatch(clearSelectedProtocol())
      }
    })

    fetchProjects()
  }, [dispatch])

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Projects</ElementTitle>
        <ElementActions>
          <button className={styles["add-button"]} onClick={() => openCreateProjectModal()}>
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
                dispatch(clearSelectedProtocol())
              }
            }}
            onInfo={() => openProjectInfoModal(project.name)}
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
