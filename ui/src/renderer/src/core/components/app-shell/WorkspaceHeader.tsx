import styles from "./app-shell.module.css"

interface WorkspaceHeaderProps {
  readonly children?: React.ReactNode
  readonly className?: string
}

function WorkspaceHeader({ children, className }: WorkspaceHeaderProps) {
  return <section className={`${styles["workspace-header"]} ${className}`}>{children}</section>
}

WorkspaceHeader.displayName = "WorkspaceHeader"

export default WorkspaceHeader
