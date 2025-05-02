import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import styles from "./protocols.module.css"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import { useSelector } from "react-redux"
import { selectSelectedProject } from "../../store/projectsSlice"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import { showSelectProjectErrorMessage } from "../../utils/dialogMessages"
import { openAddProtocolModal } from "../../utils/modalWindows"

export default function Protocols() {
  const selectedProject = useSelector(selectSelectedProject)

  const handleAdd = () => {
    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    openAddProtocolModal(selectedProject.name)
  }

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Protocols</ElementTitle>
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
