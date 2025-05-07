import styles from "./display-path.module.css"
import Button from "../button/Button"
import DisplayData from "../display-data/DisplayData"
import ContentCopyIcon from "../icons/ContentCopyIcon"
import DocumentSearchIcon from "../icons/DocumentSearchIcon"
import { useRef } from "react"

interface DisplayPathProps {
  name: string
  value: string
  disabled?: boolean
  className?: string
}

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
