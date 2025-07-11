import { useParams } from "react-router"
import styles from "./project.module.css"
import { useEffect, useState } from "react"
import Button from "@renderer/core/components/button/Button"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import DisplayData from "@renderer/core/components/display-data/DisplayData"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import LockIcon from "@renderer/core/components/icons/LockIcon"
import LockOpenIcon from "@renderer/core/components/icons/LockOpenIcon"
import {
  showApiErrorMessage,
  showLockedErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import { Project } from "@renderer/modules/organization/types/Project"
import { showDeleteProjectMessage } from "@renderer/modules/organization/utils/dialogMessages"
import projectService from "@renderer/modules/organization/services/ProjectService"
import { openUpdateProjectModal } from "@renderer/modules/organization/utils/modalWindows"
import DisplayPath from "@renderer/core/components/display-path/DisplayPath"
import { useTranslation } from "react-i18next"

export default function ProjectPage() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.project" })
  const { projectName } = useParams<{ projectName: string }>()
  const [project, setProject] = useState<Project | null>(null)

  const handleDelete = async (project: Project) => {
    if (project.locked) {
      showLockedErrorMessage(t("delete"), t("project"))
      return
    }

    const acceptId = 0
    const cancelId = 1

    const response = await showDeleteProjectMessage(project.name, acceptId, cancelId)
    if (response.response === acceptId) {
      try {
        await projectService.delete(project.name)
        window.organization.reloadProjects()
        window.organization.changeSelectedProject(null)
        window.close()
      } catch {
        showUnexpectedErrorMessage()
      }
    }
  }

  const handleUpdate = (project: Project) => {
    if (project.locked) {
      showLockedErrorMessage(t("edit"), t("project"))
      return
    }

    openUpdateProjectModal(project.name)
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
      showUnexpectedErrorMessage()
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
        showApiErrorMessage(error)
        window.close()
      }
    }

    fetchProject(projectName)
  }, [projectName])

  if (!project) {
    return <ErrorElement name={t("project")} />
  }

  return (
    <PageModal>
      <ModalHeader className={styles.header}>
        <div className={styles["title-box"]}>
          <ModalTitle title={t("title")} Icon={InfoIcon} />
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
        <DisplayData name={t("name_label")} value={project.name} />
        <DisplayData
          name={t("description_label")}
          value={project.description ? project.description : "No description"}
        />
        <DisplayPath name={t("location_label")} value={project.location} />
        <div className={styles.dates}>
          <DisplayData
            name={t("created_at_label")}
            value={new Date(project.created_at).toLocaleDateString()}
          />
          <DisplayData
            name={t("updated_at_label")}
            value={new Date(project.updated_at).toLocaleDateString()}
          />
        </div>
      </ModalBody>
    </PageModal>
  )
}
