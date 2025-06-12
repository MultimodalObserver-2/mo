import styles from "./plugin-display.module.css"

interface PluginDisplayHeaderProps {
  /** The title text for the header. */
  title: string
  /** A number to display, typically as a count. */
  num: number
}

/**
 * A sub-component for `PluginDisplay` that renders its header section,
 * including a title and a numerical count.
 *
 * @param {string} props.title - The title text to display in the header.
 * @param {number} props.num - The number to display in a badge next to the title.
 * @returns {React.ReactElement} The rendered plugin display header component.
 */
function PluginDisplayHeader({ title, num }: Readonly<PluginDisplayHeaderProps>) {
  return (
    <section className={styles.header}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.num}>{num}</div>
    </section>
  )
}

PluginDisplayHeader.displayName = "PluginDisplayHeader"

export default PluginDisplayHeader
