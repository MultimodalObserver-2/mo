import styles from "./session.module.css"
import DisplayData from "@renderer/core/components/display-data/DisplayData"
import InfoIcon from "@renderer/core/components/icons/InfoIcon"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import PageModal from "@renderer/core/components/page-modal/PageModal"
import { useEffect, useState } from "react"
import { useParams } from "react-router"
import sessionService from "../../services/SessionService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import DisplayPath from "@renderer/core/components/display-path/DisplayPath"
import { CaptureSession } from "../../types/Session"
import { formatDatetime } from "../../utils/helpers"
import { ElementList, ElementListItem, PanelElement } from "@renderer/core/components/panel"

export default function SessionPage() {
  const { projectName, participantCode, sessionId } = useParams<{
    projectName: string
    participantCode: string
    sessionId: string
  }>()
  const [session, setSession] = useState<CaptureSession | null>(null)
  const [selectedCaptureSetting, setSelectedCaptureSetting] = useState<number>(0)

  const getObjectEntries = (obj: Record<string, unknown>) => {
    return Object.entries(obj)
  }

  useEffect(() => {
    const fetchSession = async (
      projectName?: string,
      participantCode?: string,
      sessionId?: string
    ) => {
      if (!projectName || !participantCode || !sessionId) {
        return
      }

      try {
        const response = await sessionService.get(projectName, participantCode, sessionId)
        setSession(response.data)
      } catch (error) {
        showApiErrorMessage(error)
      }
    }

    fetchSession(projectName, participantCode, sessionId)
  }, [projectName, participantCode, sessionId])

  if (!session) {
    return <ErrorElement name="Session" />
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Session Information" Icon={InfoIcon} />
      </ModalHeader>
      <ModalBody id="modal-body">
        <DisplayData name="Session ID" value={session.session_id} />
        <DisplayPath name="Path" value={session.location} path_type="path" />
        <section>
          <DisplayData name="Started at" value={formatDatetime(session.started_at)} />
        </section>
        <section className={styles["settings-section"]}>
          <div className={styles["settings-label"]}>
            <span className={styles.bullet}></span>
            <h4 className={styles.name}>Capture settings used</h4>
          </div>
          <div className={styles["settings-container"]}>
            <PanelElement
              className={`${styles["settings-panel"]} ${session.capture_sources.length === 0 ? styles.empty : ""}`}
            >
              <ElementList className={styles["settings-list"]}>
                {session.capture_sources.length > 0 ? (
                  session.capture_sources.map((setting, index) => (
                    <ElementListItem
                      key={setting.setting_name}
                      label={setting.setting_name}
                      isSelected={selectedCaptureSetting === index}
                      onClick={() => setSelectedCaptureSetting(index)}
                      showActions={false}
                    />
                  ))
                ) : (
                  <ElementListItem label="No capture settings found" showActions={false} />
                )}
              </ElementList>
            </PanelElement>
            <div className={styles["setting-info"]}>
              {session.capture_sources.length > 0 && (
                <>
                  <DisplayData
                    name="Plugin ID"
                    value={session.capture_sources[selectedCaptureSetting].plugin_id}
                  />
                  <section className={styles["plugin-section"]}>
                    <DisplayData
                      name="Plugin name"
                      value={session.capture_sources[selectedCaptureSetting].plugin_name}
                    />
                    <DisplayData
                      name="Plugin Version"
                      value={session.capture_sources[selectedCaptureSetting].plugin_version}
                    />
                  </section>
                  <DisplayPath
                    name="File location"
                    value={
                      session.capture_sources[selectedCaptureSetting].location ||
                      "No file location found"
                    }
                    disabled={!session.capture_sources[selectedCaptureSetting].location}
                  />
                  <section className={styles["settings-details"]}>
                    <div className={styles["settings-details-label"]}>
                      <span className={styles.bullet}></span>
                      <h4 className={styles.name}>Settings</h4>
                    </div>
                    <div className={styles["settings-details-container"]}>
                      <DisplayData
                        name="Setting Name:"
                        boxStyle="horizontal"
                        value={session.capture_sources[selectedCaptureSetting].setting_name}
                      />
                      {getObjectEntries(
                        session.capture_sources[selectedCaptureSetting].settings
                      ).map(([key, value]) => (
                        <DisplayData
                          key={key}
                          name={key + ":"}
                          boxStyle="horizontal"
                          value={String(value)}
                        />
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        </section>
      </ModalBody>
    </PageModal>
  )
}
