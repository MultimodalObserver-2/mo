import ArrowDownIcon from "../icons/ArrowDownIcon"
import styles from "./plugin-display.module.css"

export interface PluginDisplayHeaderProps {
  /** The title text for the header. */
  title: string
  /** A number to display, typically as a count. */
  num: number
  /** Indicates if the header is expandable. If true, it may include a toggle for expansion. */
  isExpandable?: boolean
  /** Optional flag to indicate if the header is currently expanded. */
  isExpanded?: boolean
  /** Callback function to handle toggling the expanded state. */
  onToggleExpand?: () => void
}

/**
 * A sub-component for `PluginDisplay` that renders its header section,
 * including a title and a numerical count.
 *
 * @param {string} props.title - The title text to display in the header.
 * @param {number} props.num - The number to display in a badge next to the title.
 * @param {boolean} [props.isExpandable=false] - Indicates if the header is expandable.
 * @param {boolean} [props.isExpanded=true] - Indicates if the header is currently expanded.
 * @param {function} [props.onToggleExpand] - Callback function to handle toggling the expanded state.
 * @returns {React.ReactElement} The rendered plugin display header component.
 */
function PluginDisplayHeader({
  title,
  num,
  isExpandable = false,
  isExpanded = true,
  onToggleExpand
}: Readonly<PluginDisplayHeaderProps>) {
  return (
    <section className={styles.header}>
      <div className={styles.left}>
        {isExpandable && (
          <button
            className={styles.toggle}
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Collapse section" : "Expand section"}
            aria-expanded={isExpanded}
          >
            <ArrowDownIcon className={`${styles.arrow} ${isExpanded ? "" : styles.right}`} />
          </button>
        )}
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={styles.num}>{num}</div>
    </section>
  )
}

PluginDisplayHeader.displayName = "PluginDisplayHeader"

export default PluginDisplayHeader
