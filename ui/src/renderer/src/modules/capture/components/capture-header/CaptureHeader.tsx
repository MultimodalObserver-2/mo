import styles from "./capture-header.module.css"
import { useEffect, useState } from "react"
import { CaptureStatus } from "../../types/Capture"
import captureService from "../../services/CaptureService"
import CameraIcon from "@renderer/core/components/icons/CameraIcon"

export default function CaptureHeader() {
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

    window.capture.onReloadCaptureStatus(() => {
      fetchStatus()
    })

    fetchStatus()
    return () => {
      window.capture.removeReloadCaptureStatusListeners()
    }
  }, [])

  if (!status.started || !status.project_name || !status.participant_code) {
    return <></>
  }

  return (
    <div className={styles.header}>
      <CameraIcon className={styles.icon} />
      <h4 className={styles.text}>
        Participant <strong>{status.participant_code}</strong> in{" "}
        <strong>{status.project_name}</strong>
      </h4>
    </div>
  )
}
