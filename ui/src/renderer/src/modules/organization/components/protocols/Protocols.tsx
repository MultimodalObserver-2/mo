import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import styles from "./protocols.module.css"
import ElementHeader from "@renderer/core/components/panel/panel-element/element-header/ElementHeader"
import ElementTitle from "@renderer/core/components/panel/panel-element/element-header/ElementTitle"
import ElementActions from "@renderer/core/components/panel/panel-element/element-header/ElementActions"
import { useDispatch, useSelector } from "react-redux"
import { selectSelectedProject } from "../../store/projectsSlice"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import {
  showDeleteProtocolMessage,
  showSelectProjectErrorMessage
} from "../../utils/dialogMessages"
import {
  openAddProtocolModal,
  openProtocolInfoModal,
  openUpdateProtocolModal
} from "../../utils/modalWindows"
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
import {
  clearSelectedProtocol,
  selectSelectedProtocol,
  setSelectedProtocol
} from "../../store/protocolsSlice"

export default function Protocols() {
  const selectedProject = useSelector(selectSelectedProject)
  const selectedProtocol = useSelector(selectSelectedProtocol)
  const dispatch = useDispatch()
  const [protocols, setProtocols] = useState<Protocol[]>([])

  const fetchProtocols = useCallback(
    async (project: Project | null) => {
      if (!project) {
        dispatch(clearSelectedProtocol())
        setProtocols([])
        return
      }

      try {
        const response = await protocolService.getAll(project.name)
        setProtocols(response.data)
      } catch {
        showUnexpectedErrorMessage()
        dispatch(clearSelectedProtocol())
        setProtocols([])
      }
    },
    [dispatch]
  )

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
        if (protocol.name === selectedProtocol?.name) {
          dispatch(clearSelectedProtocol())
        }
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

  const handleInfo = (protocol: Protocol) => {
    if (!selectedProject) {
      showSelectProjectErrorMessage()
      return
    }

    openProtocolInfoModal(selectedProject.name, protocol.name)
  }

  useEffect(() => {
    window.organization.onChangeSelectedProtocol((protocol) => {
      if (protocol) {
        dispatch(setSelectedProtocol(protocol))
      } else {
        dispatch(clearSelectedProtocol())
      }
    })
  }, [dispatch])

  useEffect(() => {
    window.organization.onReloadProtocols(() => {
      fetchProtocols(selectedProject)
    })
    fetchProtocols(selectedProject)
    return () => {
      window.organization.removeReloadProtocols()
    }
  }, [selectedProject, fetchProtocols])

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
            isSelected={protocol.name === selectedProtocol?.name}
            showActions={true}
            onClick={() => dispatch(setSelectedProtocol(protocol))}
            onInfo={() => handleInfo(protocol)}
            onEdit={() => handleEdit(protocol)}
            onDelete={() => handleDelete(protocol)}
            onLock={() => handleLock(protocol)}
          />
        ))}
      </ElementList>
    </PanelElement>
  )
}
