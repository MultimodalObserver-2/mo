import { useTranslation } from "react-i18next"
import styles from "./display-path.module.css"
import Button from "../button/Button"
import DisplayData from "../display-data/DisplayData"
import ContentCopyIcon from "../icons/ContentCopyIcon"
import DocumentSearchIcon from "../icons/DocumentSearchIcon"
import { useRef } from "react"
import BrowserExploreIcon from "../icons/BrowserExploreIcon"

interface DisplayPathProps {
  /** The name of the path to be displayed */
  name: string
  /** The path to be displayed */
  value: string
  /** Whether the buttons should be disabled */
  disabled?: boolean
  /** The type of path, which determines the icon for the "open" button */
  path_type?: "url" | "path"
  /** Additional class name for styling */
  className?: string
}

/**
 * Displays a file path or URL with action buttons to copy the value or
 * open it in the native file explorer or browser.
 *
 * @param {string} props.name - The descriptive label for the path.
 * @param {string} props.value - The actual path or URL string.
 * @param {boolean} [props.disabled=false] - If true, the action buttons will be disabled.
 * @param {"url" | "path"} [props.path_type="path"] - Determines the "open" button's icon.
 * @param {string} [props.className] - An additional CSS class for the component's container.
 * @returns {React.ReactElement} The rendered path display component.
 */
export default function DisplayPath({
  name,
  value,
  disabled = false,
  path_type = "path",
  className
}: Readonly<DisplayPathProps>) {
  const { t } = useTranslation("core", { keyPrefix: "components.displayPath" })
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
          title={t("copyToClipboard")}
          disabled={disabled}
          className={styles["location-button"]}
          styleType="soft"
          onClick={() => handleCopy(value)}
        >
          <ContentCopyIcon className={styles["button-icon"]} />
        </Button>
        <span ref={copyMessage} className={styles["copy-message"]}>
          {t("copied")}
        </span>
      </span>
      <Button
        title={path_type === "path" ? t("openInFileExplorer") : t("openInBrowser")}
        disabled={disabled}
        className={styles["location-button"]}
        styleType="soft"
        onClick={() => handleOpenPath(value)}
      >
        {path_type === "path" ? (
          <DocumentSearchIcon className={styles["button-icon"]} />
        ) : (
          <BrowserExploreIcon className={styles["button-icon"]} />
        )}
      </Button>
    </DisplayData>
  )
}
