import styles from "./participants.module.css"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import { useSelector } from "react-redux"
import { selectSelectedProject } from "../../store/organizationSlice"

export default function Participants() {
  const selectedProject = useSelector(selectSelectedProject)

  const handleAdd = () => {
    if (!selectedProject) {
      window.core.dialog.showErrorBox("Add error", "Please select a project first")
      return
    }

    window.core.openModalWindow(
      { width: 550, height: 380, minWidth: 550, minHeight: 380, title: "Add Participant" },
      `organization/${selectedProject?.name}/add-participant`
    )
  }

  return (
    <PanelElement>
      <ElementHeader>
        <ElementTitle>Participants</ElementTitle>
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
