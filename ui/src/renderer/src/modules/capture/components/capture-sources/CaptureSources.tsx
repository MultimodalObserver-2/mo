import styles from "./capture-sources.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { openCaptureSourceModal } from "../../utils/modalWindows"
import {
  ElementActions,
  ElementHeader,
  ElementTitle,
  PanelElement
} from "@renderer/core/components/panel"

export default function CaptureSources() {
  const selectedProject = useSelector(selectSelectedProject)

  const handleAdd = () => {
    if (!selectedProject) {
      return
    }
    openCaptureSourceModal(selectedProject.name)
  }

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Capture sources</ElementTitle>
        <ElementActions>
          {selectedProject && (
            <button className={styles["add-button"]} onClick={handleAdd}>
              <AddCircleIcon className={styles.svg} />
            </button>
          )}
        </ElementActions>
      </ElementHeader>
    </PanelElement>
  )
}
