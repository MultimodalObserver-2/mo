import styles from "./panel.module.css"

interface PanelProps {
  /** Content to render inside the panel */
  readonly children: React.ReactNode
  /** Optional CSS class name for additional styling */
  readonly className?: string
}

/**
 * A container component that acts as the parent for a panel layout. It is
 * designed to contain `PanelElement` sub-components to create a structured
 * and styled panel.
 *
 * @param {React.ReactNode} props.children - The child components to render inside, typically one or more `PanelElement` instances.
 * @param {string} props.className - An optional CSS class name for additional styling.
 * @returns {React.ReactElement} The rendered panel container component.
 */
export default function Panel({ children, className }: PanelProps) {
  return <section className={`${styles.panel} ${className}`}>{children}</section>
}
