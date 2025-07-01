import styles from "./protocol-actions.module.css"
import Button from "@renderer/core/components/button/Button"
import { useEffect, useState } from "react"
import StopCircleIcon from "@renderer/core/components/icons/StopCircleIcon"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { selectSelectedProject } from "@renderer/modules/organization/store/projectsSlice"
import { useSelector } from "react-redux"
import { selectSelectedProtocol } from "../../store/protocolsSlice"
import FlowsheetIcon from "@renderer/core/components/icons/FlowsheetIcon"

export default function ProtocolActions() {
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
    const unsub = window.organization.onExecProtocolFinished(() => {
      setIsExecuting(false)
    })
    return () => {
      unsub()
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
      return "Stop protocol execution"
    } else if (!selectedProject && !selectedProtocol) {
      return "Select a project and the protocol to start the execution"
    } else if (!selectedProtocol) {
      return "Select a protocol to start the execution"
    } else if (!selectedProject) {
      return "Select a project to start the protocol execution"
    }
    return `Ready to start the protocol execution of ${selectedProtocol?.name} for ${selectedProject?.name}`
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
              STOP PROTOCOL
            </>
          ) : (
            <>
              <FlowsheetIcon className={styles.icon} />
              START PROTOCOL
            </>
          )}
        </Button>
      </abbr>
    </section>
  )
}
