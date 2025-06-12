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
  /** The display name of the plugin. */
  name: string
  /** The optional version string of the plugin. */
  version?: string
  /** A short description of the plugin's functionality. */
  description: string
  /** The path to the icon, or an object with light/dark theme paths. */
  iconPath: string | PluginIcons
  /** If true, the card is rendered with a 'selected' style. */
  isSelected?: boolean
  /** If true, shows a report button when the plugin is not loaded. */
  showReport?: boolean
  /** Indicates the plugin's loaded status, affecting icons and actions. */
  isLoaded?: boolean
  /** Controls visibility of action icons. A boolean toggles all, an object controls them individually. */
  showActions?: boolean | { info: boolean; delete: boolean }
  /** Callback executed when the card is clicked. */
  onClick?: () => void
  /** Callback executed when the report button is clicked. */
  onReport?: () => void
  /** Callback executed when the info/details icon is clicked. */
  onDetails?: () => void
  /** Callback executed when the delete icon is clicked. */
  onDelete?: () => void
}

/**
 * A detailed card component used to display information about a single plugin.
 * It uses the `WideCard` layout to show the plugin's name, version, icon, and
 * description, along with conditional actions and states.
 *
 * @param {string} props.name - The display name of the plugin.
 * @param {string} [props.version] - The optional version string of the plugin.
 * @param {string} props.description - A short description of the plugin's functionality.
 * @param {string | PluginIcons} props.iconPath - Path to the icon, or an object with light/dark paths.
 * @param {boolean} [props.isSelected=false] - If true, the card is styled as 'selected'.
 * @param {boolean} [props.showReport=false] - If true, a report button is shown if the plugin is not loaded.
 * @param {boolean} [props.isLoaded=true] - The loaded status of the plugin.
 * @param {boolean | { info: boolean; delete: boolean }} [props.showActions=true] - Controls visibility of action icons.
 * @param {() => void} [props.onClick] - Callback for when the entire card is clicked.
 * @param {() => void} [props.onReport] - Callback for the report button.
 * @param {() => void} [props.onDetails] - Callback for the details (info) icon.
 * @param {() => void} [props.onDelete] - Callback for the delete icon.
 * @returns {React.ReactElement} The rendered plugin card component.
 */
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
