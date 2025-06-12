import styles from "./panel.module.css"

interface PanelProps {
  /** Content to render inside the panel */
  readonly children: React.ReactNode
}

/**
 * A container component that acts as the parent for a panel layout. It is
 * designed to contain `PanelElement` sub-components to create a structured
 * and styled panel.
 *
 * @param {React.ReactNode} props.children - The child components to render inside, typically one or more `PanelElement` instances.
 * @returns {React.ReactElement} The rendered panel container component.
 */
export default function Panel({ children }: PanelProps) {
  return <section className={styles.panel}>{children}</section>
}
