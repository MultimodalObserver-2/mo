import styles from "./plugin-display.module.css"
import fallbackimg from "@renderer/core/assets/images/plugin_fallback.svg"
import fallbackimgLight from "@renderer/core/assets/images/plugin_fallback_light.svg"
import fallbackNotLoadedLight from "@renderer/core/assets/images/plugin_off_light.svg"
import fallbackNotLoadedDark from "@renderer/core/assets/images/plugin_off_dark.svg"
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
import { PluginIcons } from "@renderer/core/types/Plugin"

interface PluginCardProps {
  name: string
  version?: string
  description: string
  iconPath: string | PluginIcons
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

  const isDarkMode = document.getElementById("plugin-display")?.classList.contains(styles.dark)
  const finalIconPath =
    typeof iconPath === "string" ? iconPath : iconPath[isDarkMode ? "light" : "dark"]

  return (
    <WideCard
      key={name}
      className={`${styles.plugin} ${isSelected ? styles.selected : ""}`}
      onClick={onClick}
    >
      <WideCardIcon
        src={finalIconPath}
        alt={name}
        className={styles.icon}
        onError={(e) => {
          e.currentTarget.onerror = null
          if (isDarkMode) {
            if (isLoaded) {
              e.currentTarget.src = fallbackimgLight
            } else {
              e.currentTarget.src = fallbackNotLoadedLight
            }
          } else {
            if (isLoaded) {
              e.currentTarget.src = fallbackimg
            } else {
              e.currentTarget.src = fallbackNotLoadedDark
            }
          }
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
