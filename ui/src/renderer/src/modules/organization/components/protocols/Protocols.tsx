import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import styles from "./protocols.module.css"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import { useSelector } from "react-redux"
import { selectSelectedProject } from "../../store/projectsSlice"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import {
  showDeleteProtocolMessage,
  showSelectProjectErrorMessage
} from "../../utils/dialogMessages"
import { openAddProtocolModal, openUpdateProtocolModal } from "../../utils/modalWindows"
import {
  showApiErrorMessage,
  showLockedErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
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

  const handleEdit = (protocol: Protocol) => {
    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    if (protocol.locked) {
      showLockedErrorMessage("edit", "protocol")
      return
    }

    openUpdateProtocolModal(selectedProject.name, protocol.name)
  }

  const handleDelete = async (protocol: Protocol) => {
    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    if (protocol.locked) {
      showLockedErrorMessage("delete", "protocol")
      return
    }

    const [acceptId, cancelId] = [0, 1]
    const response = await showDeleteProtocolMessage(
      protocol.name,
      selectedProject.name,
      acceptId,
      cancelId
    )
    if (response.response === acceptId) {
      try {
        await protocolService.delete(selectedProject.name, protocol.name)
        await fetchProtocols(selectedProject)
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  const handleLock = async (protocol: Protocol) => {
    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    try {
      if (protocol.locked) {
        await protocolService.unlock(selectedProject.name, protocol.name)
      } else {
        await protocolService.lock(selectedProject.name, protocol.name)
      }
      await fetchProtocols(selectedProject)
    } catch {
      showUnexpectedErrorMessage()
    }
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
            isLocked={protocol.locked}
            showActions={{ info: false, delete: true, edit: true, lock: true }}
            onClick={() => {}}
            onEdit={() => handleEdit(protocol)}
            onDelete={() => handleDelete(protocol)}
            onLock={() => handleLock(protocol)}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
