import styles from "./capture-button.module.css"
import Button from "@renderer/core/components/button/Button"
import PlayCircleIcon from "@renderer/core/components/icons/PlayCircleIcon"
import { useEffect, useState } from "react"
import captureService from "../../services/CaptureService"
import StopCircleIcon from "@renderer/core/components/icons/StopCircleIcon"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { selectSelectedParticipant } from "@renderer/modules/organization/store/participantsSlice"

export default function CaptureButton() {
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const [isCapturing, setIsCapturing] = useState(false)

  useEffect(() => {
    const checkCaptureStatus = async () => {
      try {
        const response = await captureService.getStatus()
        setIsCapturing(response.data)
      } catch {
        setIsCapturing(false)
      }
    }

    checkCaptureStatus()
  }, [])

  const handleCaptureToggle = async () => {
    try {
      if (isCapturing) {
        await captureService.stopCapture()
      } else {
        const data = {
          project_name: selectedProject?.name || "",
          participant_code: selectedParticipant?.code || ""
        }
        console.log(data)
        await captureService.startCapture(data)
      }
      setIsCapturing(!isCapturing)
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  return (
    <Button
      className={styles["main-button"]}
      borderRadius="xl"
      onClick={handleCaptureToggle}
      disabled={!selectedProject || !selectedParticipant}
    >
      {isCapturing ? (
        <>
          <StopCircleIcon className={styles.icon} />
          STOP CAPTURE
        </>
      ) : (
        <>
          <PlayCircleIcon className={styles.icon} />
          START CAPTURE
        </>
      )}
    </Button>
  )
}
