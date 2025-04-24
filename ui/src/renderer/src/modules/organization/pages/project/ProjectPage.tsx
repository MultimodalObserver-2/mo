import { useParams } from "react-router"
import styles from "./project.module.css"
import projectService from "../../services/ProjectService"
import { useEffect, useRef, useState } from "react"
import Button from "@renderer/core/components/button/Button"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import { MessageBoxOptions } from "electron"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import DisplayData from "@renderer/core/components/display-data/DisplayData"
import ContentCopyIcon from "@renderer/core/components/icons/ContentCopyIcon"
import DocumentSearchIcon from "@renderer/core/components/icons/DocumentSearchIcon"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import { Project } from "../../types/Project"
import LockIcon from "@renderer/core/components/icons/LockIcon"
import LockOpenIcon from "@renderer/core/components/icons/LockOpenIcon"

export default function ProjectPage() {
  const { projectName } = useParams<{ projectName: string }>()
  const copyMessage = useRef<HTMLSpanElement>(null)

  const [project, setProject] = useState<Project | null>(null)

  const handleCopy = (text: string) => {
    window.core.clipboard.writeText(text)
    if (copyMessage.current) {
      copyMessage.current.style.opacity = "1"
      setTimeout(() => {
        if (copyMessage.current) {
          copyMessage.current.style.opacity = "0"
        }
      }, 1000)
    }
  }

  const handleOpenPath = (path: string) => {
    window.core.shell.openPath(path)
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
        window.organization.reloadProjects()
        window.organization.changeSelectedProject(null)
        window.close()
      } catch {
        window.core.dialog.showErrorBox("Delete Error", "An unexpected error occurred")
      }
    }
  }

  const handleUpdate = (project: Project) => {
    if (project.locked) {
      window.core.dialog.showErrorBox(
        "Update error",
        "You cannot update a locked project, please unlock it first"
      )
      return
    }

    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Update Project" },
      `organization/update-project/${project.name}`
    )
  }

  const handleLock = async (project: Project) => {
    try {
      if (project.locked) {
        await projectService.unlock(project.name)
      } else {
        await projectService.lock(project.name)
      }
      window.organization.reloadProjects()
      setProject((prevProject) => ({
        ...prevProject!,
        locked: !prevProject!.locked
      }))
    } catch {
      window.core.dialog.showErrorBox("Lock error", "An unexpected error occurred")
    }
  }

  useEffect(() => {
    async function fetchProject(projectName: string | undefined) {
      if (!projectName) {
        return
      }

      try {
        const response = await projectService.get(projectName)
        setProject(response.data)
      } catch (error) {
        let errorMessage = "An unexpected error occurred"
        if (error instanceof Error) {
          errorMessage = error.message
        }
        window.core.dialog.showErrorBox("Project error", errorMessage)
        window.close()
      }
    }

    fetchProject(projectName)
  }, [projectName])

  if (!project) {
    return <ErrorElement name="Project" />
  }

  return (
    <PageModal>
      <ModalHeader className={styles.header}>
        <div className={styles["title-box"]}>
          <ModalTitle title="Project Information" Icon={InfoIcon} />
        </div>
        <div className={styles.actions}>
          <Button
            styleType="soft"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleLock(project)}
          >
            {project.locked ? (
              <LockIcon className={styles["action-icon"]} />
            ) : (
              <LockOpenIcon className={styles["action-icon"]} />
            )}
          </Button>
          <Button
            styleType="soft"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleUpdate(project)}
          >
            <EditIcon className={styles["action-icon"]} />
          </Button>
          <Button
            styleType="danger"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleDelete(project)}
          >
            <DeleteIcon className={styles["action-icon"]} />
          </Button>
        </div>
      </ModalHeader>
      <ModalBody>
        <DisplayData name="Name" value={project.name} />
        <DisplayData
          name="Description"
          value={project.description ? project.description : "No description"}
        />
        <DisplayData
          name="Location"
          value={project.location}
          childrenClass={styles["location-box"]}
        >
          <span className={styles["copy-container"]}>
            <Button
              className={styles["location-button"]}
              styleType="soft"
              onClick={() => handleCopy(project.location)}
            >
              <ContentCopyIcon className={styles["button-icon"]} />
            </Button>
            <span ref={copyMessage} className={styles["copy-message"]}>
              Copied!
            </span>
          </span>
          <Button
            className={styles["location-button"]}
            styleType="soft"
            onClick={() => handleOpenPath(project.location)}
          >
            <DocumentSearchIcon className={styles["button-icon"]} />
          </Button>
        </DisplayData>
        <div className={styles.dates}>
          <DisplayData
            name="Created At"
            value={new Date(project.created_at).toLocaleDateString()}
          />
          <DisplayData
            name="Updated At"
            value={new Date(project.updated_at).toLocaleDateString()}
          />
        </div>
      </ModalBody>
    </PageModal>
  )
}
