import styles from "./protocol-actions.module.css"
import Button from "@renderer/core/components/button/Button"
import { useEffect, useState } from "react"
import StopCircleIcon from "@renderer/core/components/icons/StopCircleIcon"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { selectSelectedProtocol } from "../../store/protocolsSlice"
import FlowsheetIcon from "@renderer/core/components/icons/FlowsheetIcon"
import { useTranslation } from "react-i18next"

export default function ProtocolActions() {
  const { t } = useTranslation("organization", { keyPrefix: "components.protocolActions" })
  const selectedProject = useSelector(selectSelectedProject)
  const selectedProtocol = useSelector(selectSelectedProtocol)
  const [isExecuting, setIsExecuting] = useState(false)

  const checkProtocolStatus = async () => {
    try {
      const response = await window.organization.getProtocolExecutionStatus()
      setIsExecuting(response.isRunning)
    } catch {
      setIsExecuting(false)
    }
  }

  useEffect(() => {
    checkProtocolStatus()
    const removeStartedListener = window.organization.onExecProtocolStarted(() => {
      setIsExecuting(true)
    })

    const removeFinishedListener = window.organization.onExecProtocolFinished(() => {
      setIsExecuting(false)
    })
    return () => {
      removeStartedListener()
      removeFinishedListener()
    }
  }, [])

  const handleCaptureToggle = async () => {
    try {
      if (isExecuting) {
        window.organization.stopProtocolExecution()
      } else {
        window.organization.execProtocol(selectedProject?.name ?? "", selectedProtocol?.name ?? "")
      }
      setIsExecuting(!isExecuting)
    } catch (error) {
      checkProtocolStatus()
      showApiErrorMessage(error)
    }
  }

  const getAbbrText = () => {
    if (isExecuting) {
      return t("abbr.stop")
    } else if (!selectedProject && !selectedProtocol) {
      return t("abbr.selectProjectAndProtocol")
    } else if (!selectedProtocol) {
      return t("abbr.selectProtocol")
    } else if (!selectedProject) {
      return t("abbr.selectProject")
    }
    return t("abbr.start")
  }

  return (
    <section className={styles["protocol-actions"]}>
      <abbr className={styles.abbr} title={getAbbrText()}>
        <Button
          className={styles["main-button"]}
          borderRadius="sm"
          styleType={isExecuting ? "danger" : "default"}
          onClick={handleCaptureToggle}
          disabled={!isExecuting && (!selectedProject || !selectedProtocol)}
        >
          {isExecuting ? (
            <>
              <StopCircleIcon className={`${styles.icon} ${styles.danger}`} />
              {t("stop", "Stop Protocol").toUpperCase()}
            </>
          ) : (
            <>
              <FlowsheetIcon className={styles.icon} />
              {t("start", "Start Protocol").toUpperCase()}
            </>
          )}
        </Button>
      </abbr>
    </section>
  )
}
