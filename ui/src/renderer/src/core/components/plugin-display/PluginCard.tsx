import styles from "./plugin-display.module.css"
import fallbackimg from "@renderer/core/assets/images/plugin_fallback.svg"
import ReportIcon from "../icons/ReportIcon"
import InfoIcon from "../icons/InfoIcon"
import DeleteIcon from "../icons/DeleteIcon"
import Show from "../show/Show"
import {
  WideCard,
  WideCardActions,
  WideCardDescription,
  WideCardHeader,
  WideCardIcon
} from "../wide-card"

interface PluginCardProps {
  name: string
  version?: string
  description: string
  iconPath: string
  isSelected?: boolean
  showReport?: boolean
  isLoaded?: boolean
  showActions?: boolean | { info: boolean; delete: boolean }
  onClick?: () => void
  onReport?: () => void
  onDetails?: () => void
  onDelete?: () => void
}

export default function PluginCard({
  name,
  version,
  description,
  iconPath,
  isSelected = false,
  showReport = false,
  isLoaded = true,
  showActions = true,
  onClick = () => {},
  onReport = () => {},
  onDetails = () => {},
  onDelete = () => {}
}: PluginCardProps) {
  const showAction = (action: string) => {
    return typeof showActions === "boolean" ? showActions : showActions[action]
  }

  return (
    <WideCard
      key={name}
      className={`${styles.plugin} ${isSelected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <WideCardIcon
        src={iconPath}
        alt={name}
        className={styles.icon}
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = fallbackimg
        }}
      />
      <WideCardHeader>
        <h3 className={styles.name}>{name}</h3>
        <Show show={version !== undefined}>
          <div className={styles.version}>{version}</div>
        </Show>
        <Show show={showReport && !isLoaded}>
          <button className={styles.report} onClick={onReport}>
            <ReportIcon className={styles["report-icon"]} />
          </button>
        </Show>
      </WideCardHeader>
      <WideCardActions>
        <Show show={showAction("info")}>
          <InfoIcon
            className={`${styles["action-icon"]} ${styles["normal-icon"]}`}
            onClick={onDetails}
          />
        </Show>
        <Show show={showAction("delete")}>
          <DeleteIcon
            className={`${styles["action-icon"]} ${styles["danger-icon"]}`}
            onClick={onDelete}
          />
        </Show>
      </WideCardActions>
      <WideCardDescription className={styles.description}>{description}</WideCardDescription>
    </WideCard>
  )
}
