import styles from "./capture-actions.module.css"
import Button from "@renderer/core/components/button/Button"
import PlayCircleIcon from "@renderer/core/components/icons/PlayCircleIcon"
import { useEffect, useState } from "react"
import captureService from "../../services/CaptureService"
import StopCircleIcon from "@renderer/core/components/icons/StopCircleIcon"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { selectSelectedParticipant } from "@renderer/modules/organization/store/participantsSlice"
import ResumeCircleIcon from "@renderer/core/components/icons/ResumeCircleIcon"
import PauseCircleIcon from "@renderer/core/components/icons/PauseCircleIcon"

export default function CaptureActions() {
  const selectedProject = useSelector(selectSelectedProject)
  const selectedParticipant = useSelector(selectSelectedParticipant)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPause, setIsLoadingPause] = useState(false)
  const checkCaptureStatus = async () => {
    try {
      const response = await captureService.getStatus()
      setIsCapturing(response.data.started)
      setIsPaused(response.data.paused)
    } catch {
      setIsCapturing(false)
      setIsPaused(false)
    }
  }

  useEffect(() => {
    checkCaptureStatus()
  }, [])

  const handleCaptureToggle = async () => {
    try {
      setIsLoading(true)
      if (isCapturing) {
        await captureService.stopCapture()
        window.capture.reloadSessions()
      } else {
        const data = {
          project_name: selectedProject?.name ?? "",
          participant_code: selectedParticipant?.code ?? ""
        }
        await captureService.startCapture(data)
      }
      setIsCapturing(!isCapturing)
      setIsPaused(false)
    } catch (error) {
      if (isCapturing) {
        window.capture.reloadSessions()
      }
      checkCaptureStatus()
      showApiErrorMessage(error)
    }
    window.capture.reloadCaptureStatus()
    setIsLoading(false)
  }

  const handlePauseToggle = async () => {
    setIsLoadingPause(true)
    try {
      if (isPaused) {
        await captureService.resumeCapture()
        setIsPaused(false)
      } else {
        await captureService.pauseCapture()
        setIsPaused(true)
      }
    } catch (error) {
      checkCaptureStatus()
      showApiErrorMessage(error)
    }
    setIsLoadingPause(false)
  }

  const getAbbrText = () => {
    if (isCapturing) {
      return `Stop capture`
    } else if (!selectedProject && !selectedParticipant) {
      return "Select a project and participant to start capturing"
    } else if (!selectedParticipant) {
      return "Select a participant to start capturing"
    } else if (!selectedProject) {
      return "Select a project to start capturing"
    }
    return `Ready to capture for project: ${selectedProject.name}, participant: ${selectedParticipant.code}`
  }

  return (
    <section className={styles["capture-actions"]}>
      <abbr title={getAbbrText()}>
        <Button
          className={styles["main-button"]}
          borderRadius="xl"
          styleType={isCapturing ? "danger" : "default"}
          onClick={handleCaptureToggle}
          disabled={!isCapturing && (!selectedProject || !selectedParticipant)}
          isLoading={isLoading}
        >
          {isCapturing ? (
            <>
              <StopCircleIcon className={`${styles.icon} ${styles.danger}`} />
              STOP CAPTURE
            </>
          ) : (
            <>
              <PlayCircleIcon className={styles.icon} />
              START CAPTURE
            </>
          )}
        </Button>
      </abbr>
      <abbr>
        <Button
          className={`${styles["secondary-button"]} ${isCapturing ? styles.visible : ""}`}
          borderRadius="xl"
          styleType="extra-soft"
          onClick={handlePauseToggle}
          disabled={!isCapturing || isLoading}
          isLoading={isLoadingPause}
        >
          {isPaused ? (
            <ResumeCircleIcon className={styles.icon} />
          ) : (
            <PauseCircleIcon className={styles.icon} />
          )}
        </Button>
      </abbr>
    </section>
  )
}
