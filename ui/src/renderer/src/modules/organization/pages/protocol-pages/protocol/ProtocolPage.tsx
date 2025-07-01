import DisplayData from "@renderer/core/components/display-data/DisplayData"
import styles from "./protocol.module.css"
import Button from "@renderer/core/components/button/Button"
import DeleteIcon from "@renderer/core/components/icons/DeleteIcon"
import EditIcon from "@renderer/core/components/icons/EditIcon"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import LockIcon from "@renderer/core/components/icons/LockIcon"
import LockOpenIcon from "@renderer/core/components/icons/LockOpenIcon"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import { useParams } from "react-router"
import { Protocol } from "@renderer/modules/organization/types/Protocol"
import { useEffect, useState } from "react"
import {
  showApiErrorMessage,
  showLockedErrorMessage,
  showUnexpectedErrorMessage
} from "@renderer/core/utils/dialogMessages"
import protocolService from "@renderer/modules/organization/services/ProtocolService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import { openUpdateProtocolModal } from "@renderer/modules/organization/utils/modalWindows"
import { showDeleteProtocolMessage } from "@renderer/modules/organization/utils/dialogMessages"
import ElementList from "@renderer/core/components/panel/panel-element/element-list/ElementList"
import PanelElement from "@renderer/core/components/panel/panel-element/PanelElement"
import ElementListItem from "@renderer/core/components/panel/panel-element/element-list/ElementListItem"
import DisplayPath from "@renderer/core/components/display-path/DisplayPath"

export default function ProtocolPage() {
  const { projectName, protocolName } = useParams<{
    projectName: string
    protocolName: string
  }>()
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [selectedActivityIdx, setSelectedActivityIdx] = useState<number>(0)

  const handleEdit = (protocol: Protocol) => {
    if (!projectName || !protocolName) {
      return
    }

    if (protocol.locked) {
      showLockedErrorMessage("edit", "protocol")
      return
    }
    openUpdateProtocolModal(projectName, protocolName)
  }

  const handleLock = async (protocol: Protocol) => {
    if (!projectName || !protocolName) {
      return
    }

    try {
      if (protocol.locked) {
        await protocolService.unlock(projectName, protocolName)
        setProtocol({ ...protocol, locked: false })
      } else {
        await protocolService.lock(projectName, protocolName)
        setProtocol({ ...protocol, locked: true })
      }

      window.organization.reloadProtocols()
    } catch {
      showUnexpectedErrorMessage()
    }
  }

  const handleDelete = async (protocol: Protocol) => {
    if (!projectName || !protocolName) {
      return
    }

    if (protocol.locked) {
      showLockedErrorMessage("delete", "protocol")
      return
    }

    const [acceptId, cancelId] = [0, 1]
    const response = await showDeleteProtocolMessage(protocol.name, projectName, acceptId, cancelId)

    if (response.response === acceptId) {
      try {
        await protocolService.delete(projectName, protocolName)
        window.organization.reloadProtocols()
        window.organization.changeSelectedProtocol(null)
        window.close()
      } catch (error) {
        showApiErrorMessage(error)
      }
    }
  }

  useEffect(() => {
    async function fetchProtocol() {
      if (!projectName || !protocolName) {
        showUnexpectedErrorMessage()
        window.close()
        return
      }
      try {
        const response = await protocolService.get(projectName, protocolName)
        setProtocol(response.data)
      } catch (error) {
        showApiErrorMessage(error)
        window.close()
      }
    }

    fetchProtocol()
  }, [projectName, protocolName])

  if (!protocol) {
    return <ErrorElement name="Protocol" />
  }

  return (
    <PageModal>
      <ModalHeader className={styles.header}>
        <div className={styles["title-box"]}>
          <ModalTitle title="Protocol Information" Icon={InfoIcon} />
        </div>
        <div className={styles.actions}>
          <Button
            styleType="soft"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleLock(protocol)}
          >
            {protocol.locked ? (
              <LockIcon className={styles["action-icon"]} />
            ) : (
              <LockOpenIcon className={styles["action-icon"]} />
            )}
          </Button>
          <Button
            styleType="soft"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleEdit(protocol)}
          >
            <EditIcon className={styles["action-icon"]} />
          </Button>
          <Button
            styleType="danger"
            borderRadius="xl"
            className={styles["action-button"]}
            onClick={() => handleDelete(protocol)}
          >
            <DeleteIcon className={styles["action-icon"]} />
          </Button>
        </div>
      </ModalHeader>
      <ModalBody>
        <DisplayData name="Name" value={protocol.name} />
        <section className={styles.dates}>
          <DisplayData
            name="Created At"
            value={new Date(protocol.created_at).toLocaleDateString()}
          />
          <DisplayData
            name="Updated At"
            value={new Date(protocol.updated_at).toLocaleDateString()}
          />
        </section>
        <section className={styles["activities-section"]}>
          <div className={styles["activities-label"]}>
            <span className={styles.bullet}></span>
            <h4 className={styles.name}>Activities</h4>
          </div>
          <div className={styles["activities-container"]}>
            <PanelElement
              className={`${styles["activities-panel"]}  ${protocol.activities.length === 0 ? styles.empty : ""}`}
            >
              <ElementList className={styles["activities-list"]}>
                {protocol.activities.length > 0 ? (
                  protocol.activities.map((activity, index) => (
                    <ElementListItem
                      key={activity.name}
                      label={activity.name}
                      leftElement={<div className={styles["activity-index"]}>{index + 1}</div>}
                      isSelected={index === selectedActivityIdx}
                      onClick={() => setSelectedActivityIdx(index)}
                      showActions={false}
                    />
                  ))
                ) : (
                  <ElementListItem
                    label="No activities found in this protocol"
                    showActions={false}
                  />
                )}
              </ElementList>
            </PanelElement>
            <div className={styles["activity-info"]}>
              {protocol.activities.length > 0 && (
                <>
                  <DisplayData
                    name="Activity"
                    value={protocol.activities[selectedActivityIdx].name}
                  />
                  <DisplayPath
                    name="Path"
                    value={
                      protocol.activities[selectedActivityIdx].path
                        ? protocol.activities[selectedActivityIdx].path
                        : "No path defined"
                    }
                    disabled={!protocol.activities[selectedActivityIdx].path}
                  />
                  <DisplayData
                    name="Time Limit"
                    value={
                      protocol.activities[selectedActivityIdx].has_time_limit
                        ? `${protocol.activities[selectedActivityIdx].time_limit} seconds`
                        : "No time limit"
                    }
                  />
                  <DisplayData
                    name="Start Message"
                    value={protocol.activities[selectedActivityIdx].start_message || "No message"}
                  />
                  <DisplayData
                    name="End Message"
                    value={protocol.activities[selectedActivityIdx].end_message || "No message"}
                  />
                  <div className={styles["activity-info-boolean"]}>
                    <DisplayData
                      name="Close Activity"
                      value={
                        protocol.activities[selectedActivityIdx].close_activity
                          ? protocol.activities[selectedActivityIdx].process_name
                          : "No"
                      }
                    />
                    <DisplayData
                      name="Show Timer"
                      value={protocol.activities[selectedActivityIdx].show_timer ? "Yes" : "No"}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </ModalBody>
    </PageModal>
  )
}
