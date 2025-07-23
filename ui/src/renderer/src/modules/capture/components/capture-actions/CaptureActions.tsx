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
import { useTranslation } from "react-i18next"

export default function CaptureActions() {
  const { t } = useTranslation("capture", { keyPrefix: "components.captureActions" })
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
      window.capture.reloadCaptureStatus({
        isCapturing: response.data.started,
        isPaused: response.data.paused
      })
    } catch {
      setIsCapturing(false)
      setIsPaused(false)
      window.capture.reloadCaptureStatus({
        isCapturing: false,
        isPaused: false
      })
    }
  }

  useEffect(() => {
    const removeListener = window.capture.onChangeCaptureStatusTray(
      ({ isCapturing, isPaused, isLoading }) => {
        setIsCapturing(isCapturing)
        setIsPaused(isPaused)
        setIsLoading(isLoading)
      }
    )
    checkCaptureStatus()
    return () => {
      removeListener()
    }
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
      window.capture.reloadCaptureStatus({
        isCapturing: !isCapturing,
        isPaused: false
      })
      setIsCapturing(!isCapturing)
      setIsPaused(false)
    } catch (error) {
      if (isCapturing) {
        window.capture.reloadSessions()
      }
      checkCaptureStatus()
      showApiErrorMessage(error)
    }

    setIsLoading(false)
  }

  const handlePauseToggle = async () => {
    setIsLoadingPause(true)
    try {
      if (isPaused) {
        await captureService.resumeCapture()
        setIsPaused(false)
        window.capture.reloadCaptureStatus({
          isCapturing: true,
          isPaused: false
        })
      } else {
        await captureService.pauseCapture()
        setIsPaused(true)
        window.capture.reloadCaptureStatus({
          isCapturing: true,
          isPaused: true
        })
      }
    } catch (error) {
      checkCaptureStatus()
      showApiErrorMessage(error)
    }
    setIsLoadingPause(false)
  }

  const getAbbrText = () => {
    if (isCapturing) {
      return t("stop")
    } else if (!selectedProject && !selectedParticipant) {
      return t("selectProjectParticipant")
    } else if (!selectedParticipant) {
      return t("selectParticipant")
    } else if (!selectedProject) {
      return t("selectProject")
    }
    return t("ready", {
      project: selectedProject.name,
      participant: selectedParticipant.code
    })
  }

  return (
    <section className={styles["capture-actions"]}>
      <abbr className={styles.abbr} title={getAbbrText()}>
        <Button
          className={styles["main-button"]}
          borderRadius="sm"
          styleType={isCapturing ? "danger" : "default"}
          onClick={handleCaptureToggle}
          disabled={!isCapturing && (!selectedProject || !selectedParticipant)}
          isLoading={isLoading}
          data-testid="capture-toggle-button"
        >
          {isCapturing ? (
            <>
              <StopCircleIcon
                className={`${styles.icon} ${styles.danger}`}
                data-testid="capture-stop-icon"
              />
              {t("stop").toUpperCase()}
            </>
          ) : (
            <>
              <PlayCircleIcon className={styles.icon} data-testid="capture-play-icon" />
              {t("start").toUpperCase()}
            </>
          )}
        </Button>
      </abbr>
      {isCapturing && (
        <abbr title={isPaused ? t("resume") : t("pause")}>
          <Button
            className={`${styles["secondary-button"]}`}
            borderRadius="sm"
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
      )}
    </section>
  )
}
