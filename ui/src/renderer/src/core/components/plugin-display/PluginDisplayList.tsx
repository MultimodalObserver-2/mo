import { Children } from "react"
import styles from "./plugin-display.module.css"

interface PluginDisplayListProps {
  /** An optional ID for the list container element. */
  id?: string
  /** The list items (e.g., plugin cards) to be rendered. */
  children?: React.ReactNode
  /** An optional CSS class to apply to the list container. */
  className?: string
  /** If true, applies styling to indicate the list items are selectable. */
  selectable?: boolean
}

/**
 * A sub-component for `PluginDisplay` that renders a list of child elements.
 * It handles an empty state by displaying a message if no children are provided.
 *
 * @param {string} [props.id="plugin-display-list"] - An optional ID for the list container.
 * @param {React.ReactNode} [props.children] - The list items to be rendered, typically plugin cards.
 * @param {string} [props.className] - An optional CSS class for the list container.
 * @param {boolean} [props.selectable=false] - If true, applies styling to indicate the list items are selectable.
 * @returns {React.ReactElement} The rendered list component or an empty state message.
 */
function PluginDisplayList({
  id = "plugin-display-list",
  children,
  className,
  selectable = false
}: Readonly<PluginDisplayListProps>) {
  if (Children.count(children) === 0) {
    return (
      <article id={id} className={`${styles.plugins} ${className}`}>
        <h3 className={styles.empty}>No plugins found</h3>
      </article>
    )
  }

  return (
    <section
      id={id}
      className={`${styles.plugins} ${className} ${selectable ? styles.selectable : ""}`}
    >
      {children}
    </section>
  )
}

PluginDisplayList.displayName = "PluginDisplayList"

export default PluginDisplayList
