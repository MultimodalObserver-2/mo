import styles from "./app-shell.module.css"

interface WorkspaceFooterProps {
  readonly children?: React.ReactNode
  readonly borderless?: boolean
}

function WorkspaceFooter({ children, borderless = false }: WorkspaceFooterProps) {
  return (
    <section className={`${styles["workspace-footer"]} ${borderless ? "" : styles.bordered}`}>
      {children}
    </section>
  )
}

WorkspaceFooter.displayName = "WorkspaceFooter"

export default WorkspaceFooter
