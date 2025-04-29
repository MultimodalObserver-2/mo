import styles from "./panel.module.css"

interface PanelProps {
  /** Content to render inside the panel */
  readonly children: React.ReactNode
}

/** Generic panel container with predefined styling */
export default function Panel({ children }: PanelProps) {
  return <section className={styles.panel}>{children}</section>
}
