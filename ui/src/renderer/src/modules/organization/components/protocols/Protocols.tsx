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
import { showUnexpectedErrorMessage } from "@renderer/core/utils/dialogMessages"
import { Project } from "../../types/Project"
import protocolService from "../../services/ProtocolService"
import { useCallback, useEffect, useState } from "react"
import ElementList from "@renderer/core/components/panel/panel-element/element-list/ElementList"
import ElementListItem from "@renderer/core/components/panel/panel-element/element-list/ElementListItem"
import { Protocol } from "../../types/Protocol"

export default function Protocols() {
  const selectedProject = useSelector(selectSelectedProject)
  const [protocols, setProtocols] = useState<Protocol[]>([])

  const fetchProtocols = useCallback(async (project: Project | null) => {
    if (!project) {
      setProtocols([])
      return
    }
    try {
      const response = await protocolService.getAll(project.name)
      setProtocols(response.data)
    } catch {
      showUnexpectedErrorMessage()
      setProtocols([])
    }
  }, [])

  useEffect(() => {
    window.organization.onReloadProtocols(() => {
      fetchProtocols(selectedProject)
    })
    fetchProtocols(selectedProject)
    return () => {
      window.organization.removeReloadProtocols()
    }
  }, [selectedProject, fetchProtocols])

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
      <ElementList>
        {protocols.map((protocol) => (
          <ElementListItem
            key={protocol.name}
            label={protocol.name}
            showActions={false}
            onClick={() => {}}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
