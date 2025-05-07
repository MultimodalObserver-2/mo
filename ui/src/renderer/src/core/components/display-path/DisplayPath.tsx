import styles from "./display-path.module.css"
import Button from "../button/Button"
import DisplayData from "../display-data/DisplayData"
import ContentCopyIcon from "../icons/ContentCopyIcon"
import DocumentSearchIcon from "../icons/DocumentSearchIcon"
import { useRef } from "react"

interface DisplayPathProps {
  /** The name of the path to be displayed */
  name: string
  /** The path to be displayed */
  value: string
  /** Whether the buttons should be disabled */
  disabled?: boolean
  /** Additional class name for styling */
  className?: string
}

/**
 * A component that displays a file path with buttons to copy the path and open it in the file explorer.
 * @param {string} name - The name of the path to be displayed.
 * @param {string} value - The path to be displayed.
 * @param {boolean} [disabled=false] - Whether the buttons should be disabled.
 * @param {string} [className] - Additional class name for styling.
 */
export default function DisplayPath({
  name,
  value,
  disabled = false,
  className
}: Readonly<DisplayPathProps>) {
  const copyMessage = useRef<HTMLSpanElement>(null)

  const handleCopy = (text: string) => {
    window.core.clipboard.writeText(text)
    if (copyMessage.current) {
      copyMessage.current.style.opacity = "1"
      setTimeout(() => {
        if (copyMessage.current) {
          copyMessage.current.style.opacity = "0"
        }
      }, 1000)
    }
  }

  const handleOpenPath = (path: string) => {
    window.core.shell.openPath(path)
  }

  return (
    <DisplayData name={name} value={value} childrenClass={`${styles["location-box"]} ${className}`}>
      <span className={styles["copy-container"]}>
        <Button
          disabled={disabled}
          className={styles["location-button"]}
          styleType="soft"
          onClick={() => handleCopy(value)}
        >
          <ContentCopyIcon className={styles["button-icon"]} />
        </Button>
        <span ref={copyMessage} className={styles["copy-message"]}>
          Copied!
        </span>
      </span>
      <Button
        disabled={disabled}
        className={styles["location-button"]}
        styleType="soft"
        onClick={() => handleOpenPath(value)}
      >
        <DocumentSearchIcon className={styles["button-icon"]} />
      </Button>
    </DisplayData>
  )
}
