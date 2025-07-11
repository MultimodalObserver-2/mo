import { useTranslation } from "react-i18next"
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
import { formatDatetime, formatDuration } from "../../utils/helpers"
import { ElementList, ElementListItem, PanelElement } from "@renderer/core/components/panel"

export default function SessionPage() {
  const { t } = useTranslation("capture", { keyPrefix: "pages.session" })
  const { projectName, participantCode, sessionId } = useParams<{
    projectName: string
    participantCode: string
    sessionId: string
  }>()
  const [session, setSession] = useState<CaptureSession | null>(null)
  const [selectedCaptureConfig, setSelectedCaptureConfig] = useState<number>(0)

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
    return <ErrorElement name={t("session")} />
  }

  return (
    <PageModal>
      <ModalHeader>
        <ModalTitle title={t("sessionInformation")} Icon={InfoIcon} />
      </ModalHeader>
      <ModalBody id="modal-body">
        <DisplayData name={t("sessionId")} value={session.session_id} />
        <DisplayPath name={t("path")} value={session.location} path_type="path" />
        <section className={styles["session-section"]}>
          <DisplayData name={t("startedAt")} value={formatDatetime(session.started_at)} />
          <DisplayData
            name={t("endedAt")}
            value={session.ended_at ? formatDatetime(session.ended_at) : t("noEndTimeSet")}
          />
        </section>
        <section className={styles["session-section"]}>
          <DisplayData
            name={t("duration")}
            value={
              session.duration ? formatDuration(session.duration, true, true) : t("noDurationSet")
            }
          />
          <DisplayData
            name={t("pausedTime")}
            value={session.paused_time ? formatDuration(session.paused_time) : 0}
          />
        </section>
        <section className={styles["settings-section"]}>
          <div className={styles["settings-label"]}>
            <span className={styles.bullet}></span>
            <h4 className={styles.name}>{t("captureConfigurationsUsed")}</h4>
          </div>
          <div className={styles["settings-container"]}>
            <PanelElement
              className={`${styles["settings-panel"]} ${session.capture_sources.length === 0 ? styles.empty : ""}`}
            >
              <ElementList className={styles["settings-list"]}>
                {session.capture_sources.length > 0 ? (
                  session.capture_sources.map((config, index) => (
                    <ElementListItem
                      key={config.config_name}
                      label={config.config_name}
                      isSelected={selectedCaptureConfig === index}
                      onClick={() => setSelectedCaptureConfig(index)}
                      showActions={false}
                    />
                  ))
                ) : (
                  <ElementListItem label={t("noCaptureConfigurationsFound")} showActions={false} />
                )}
              </ElementList>
            </PanelElement>
            <div className={styles["setting-info"]}>
              {session.capture_sources.length > 0 && (
                <>
                  <DisplayData
                    name={t("pluginId")}
                    value={session.capture_sources[selectedCaptureConfig].plugin_id}
                  />
                  <section className={styles["plugin-section"]}>
                    <DisplayData
                      name={t("pluginName")}
                      value={session.capture_sources[selectedCaptureConfig].plugin_name}
                    />
                    <DisplayData
                      name={t("pluginVersion")}
                      value={session.capture_sources[selectedCaptureConfig].plugin_version}
                    />
                  </section>
                  <DisplayPath
                    name={t("fileLocation")}
                    value={
                      session.capture_sources[selectedCaptureConfig].location ??
                      t("noFileLocationFound")
                    }
                    disabled={!session.capture_sources[selectedCaptureConfig].location}
                  />
                  <section className={styles["settings-details"]}>
                    <div className={styles["settings-details-label"]}>
                      <span className={styles.bullet}></span>
                      <h4 className={styles.name}>{t("settings")}</h4>
                    </div>
                    <div className={styles["settings-details-container"]}>
                      <DisplayData
                        name={t("name") + ":"}
                        boxStyle="horizontal"
                        value={session.capture_sources[selectedCaptureConfig].config_name}
                      />
                      {getObjectEntries(
                        session.capture_sources[selectedCaptureConfig].settings
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
