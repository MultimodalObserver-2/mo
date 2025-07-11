import { Trans } from "react-i18next"
import styles from "./capture-header.module.css"
import { useEffect, useState } from "react"
import { CaptureStatus } from "../../types/Capture"
import captureService from "../../services/CaptureService"
import CameraIcon from "@renderer/core/components/icons/CameraIcon"

export default function CaptureHeader() {
  // const { t } = useTranslation("capture", { keyPrefix: "components.captureHeader" })
  const [status, setStatus] = useState<CaptureStatus>({
    started: false,
    paused: false
  })

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await captureService.getStatus()
        setStatus(response.data)
      } catch {
        setStatus({
          started: false,
          paused: false
        })
      }
    }

    const removeListener = window.capture.onReloadCaptureStatus(() => {
      fetchStatus()
    })

    const removeTrayListener = window.capture.onChangeCaptureStatusTray(() => {
      fetchStatus()
    })

    fetchStatus()
    return () => {
      removeListener()
      removeTrayListener()
    }
  }, [])

  if (!status.started || !status.project_name || !status.participant_code) {
    return <></>
  }

  return (
    <div className={styles.header}>
      <CameraIcon className={styles.icon} />
      <h4 className={styles.text}>
        <Trans
          i18nKey="components.captureHeader.participantForProject"
          ns="capture"
          values={{
            participant: status.participant_code,
            project: status.project_name
          }}
          components={{
            strong: <strong />
          }}
        />
      </h4>
    </div>
  )
}
