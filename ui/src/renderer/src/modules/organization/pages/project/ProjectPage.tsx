import { Await, useParams } from "react-router"
import styles from "./project.module.css"
import projectService from "../../services/ProjectService"
import { Suspense, useRef } from "react"
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

export default function ProjectPage() {
  const { projectName } = useParams<{ projectName: string }>()
  const copyMessage = useRef<HTMLSpanElement>(null)

  async function fetchProject(projectName: string | undefined) {
    if (!projectName) {
      throw new Error("No project name declared")
    }

    const response = await projectService.get(projectName)
    return response.data
  }

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
    console.log(path)
    window.core.shell.openPath(path)
  }

  const handleDelete = async () => {
    if (!projectName) {
      return
    }

    const buttons = ["Accept", "Cancel"]
    const acceptId = 0
    const cancelId = 1
    const options: MessageBoxOptions = {
      title: "Delete Project",
      message: `Are you sure you want to delete the project ${projectName}?, this will delete all the data related to this project`,
      type: "warning",
      buttons: buttons,
      defaultId: acceptId,
      cancelId: cancelId,
      noLink: true
    }

    const response = await window.core.dialog.showMessageBox(options)
    if (response.response === acceptId) {
      try {
        await projectService.delete(projectName)
        window.organization.reloadProjects()
        window.close()
      } catch {
        window.core.dialog.showErrorBox("Delete Error", "An unexpected error occurred")
      }
    }
  }

  const handleUpdate = () => {
    if (!projectName) {
      return
    }

    window.core.openModalWindow(
      { width: 550, height: 310, minWidth: 550, minHeight: 310, title: "Update Project" },
      `organization/update-project/${projectName}`
    )
  }

  const projectPromise = fetchProject(projectName)

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
            onClick={handleUpdate}
          >
            <EditIcon className={styles["action-icon"]} />
          </Button>
          <Button
            styleType="danger"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={handleDelete}
          >
            <DeleteIcon className={styles["action-icon"]} />
          </Button>
        </div>
      </ModalHeader>
      <ModalBody>
        <Suspense>
          <Await resolve={projectPromise} errorElement={<ErrorElement name="Project" />}>
            {(project) => (
              <>
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
              </>
            )}
          </Await>
        </Suspense>
      </ModalBody>
    </PageModal>
  )
}
