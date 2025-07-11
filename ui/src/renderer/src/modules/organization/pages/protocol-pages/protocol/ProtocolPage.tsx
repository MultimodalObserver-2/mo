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
import { useTranslation } from "react-i18next"

export default function ProtocolPage() {
  const { t } = useTranslation("organization", { keyPrefix: "pages.protocol" })
  const { projectName, protocolName } = useParams<{
    projectName: string
    protocolName: string
  }>()
  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [selectedActivityIdx, setSelectedActivityIdx] = useState<number>(0)

  const handleEdit = (protocol: Protocol) => {
    if (!projectName || !protocolName) return

    if (protocol.locked) {
      showLockedErrorMessage(t("edit"), t("protocol"))
      return
    }
    openUpdateProtocolModal(projectName, protocolName)
  }

  const handleLock = async (protocol: Protocol) => {
    if (!projectName || !protocolName) return
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
    if (!projectName || !protocolName) return

    if (protocol.locked) {
      showLockedErrorMessage(t("delete"), t("protocol"))
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
    return <ErrorElement name={t("title")} />
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
        <DisplayData name={t("name")} value={protocol.name} />
        <section className={styles.dates}>
          <DisplayData
            name={t("created_at")}
            value={new Date(protocol.created_at).toLocaleDateString()}
          />
          <DisplayData
            name={t("updated_at")}
            value={new Date(protocol.updated_at).toLocaleDateString()}
          />
        </section>
        <section className={styles["activities-section"]}>
          <div className={styles["activities-label"]}>
            <span className={styles.bullet}></span>
            <h4 className={styles.name}>{t("activities_title")}</h4>
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
                  <ElementListItem label={t("no_activities")} showActions={false} />
                )}
              </ElementList>
            </PanelElement>
            <div className={styles["activity-info"]}>
              {protocol.activities.length > 0 && (
                <>
                  <DisplayData
                    name={t("activity_label")}
                    value={protocol.activities[selectedActivityIdx].name}
                  />
                  <DisplayPath
                    name={t("path_label")}
                    value={
                      protocol.activities[selectedActivityIdx].path
                        ? protocol.activities[selectedActivityIdx].path
                        : t("no_path_defined")
                    }
                    disabled={!protocol.activities[selectedActivityIdx].path}
                  />
                  <DisplayData
                    name={t("time_limit_label")}
                    value={
                      protocol.activities[selectedActivityIdx].has_time_limit
                        ? t("time_limit_seconds", {
                            count: protocol.activities[selectedActivityIdx].time_limit
                          })
                        : t("no_time_limit")
                    }
                  />
                  <DisplayData
                    name={t("start_message_label")}
                    value={
                      protocol.activities[selectedActivityIdx].start_message || t("no_message")
                    }
                  />
                  <DisplayData
                    name={t("end_message_label")}
                    value={protocol.activities[selectedActivityIdx].end_message || t("no_message")}
                  />
                  <div className={styles["activity-info-boolean"]}>
                    <DisplayData
                      name={t("close_activity_label")}
                      value={
                        protocol.activities[selectedActivityIdx].close_activity
                          ? t("close_activity_value", {
                              processName: protocol.activities[selectedActivityIdx].process_name
                            })
                          : t("no_value")
                      }
                    />
                    <DisplayData
                      name={t("show_timer_label")}
                      value={
                        protocol.activities[selectedActivityIdx].show_timer ? t("yes") : t("no")
                      }
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
