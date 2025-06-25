import styles from "./app-shell.module.css"

interface WorkspaceHeaderProps {
  readonly children?: React.ReactNode
}

function WorkspaceHeader({ children }: WorkspaceHeaderProps) {
  return <section className={styles["workspace-header"]}>{children}</section>
}

WorkspaceHeader.displayName = "WorkspaceHeader"

export default WorkspaceHeader
