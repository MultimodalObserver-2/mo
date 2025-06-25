import styles from "./app-shell.module.css"

interface WorkspaceFooterProps {
  readonly children?: React.ReactNode
}

function WorkspaceFooter({ children }: WorkspaceFooterProps) {
  return <section className={styles["workspace-footer"]}>{children}</section>
}

WorkspaceFooter.displayName = "WorkspaceFooter"

export default WorkspaceFooter
