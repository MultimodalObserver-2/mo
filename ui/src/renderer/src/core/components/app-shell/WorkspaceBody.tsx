import styles from "./app-shell.module.css"

interface WorkspaceBodyProps {
  readonly children?: React.ReactNode
  readonly className?: string
}

function WorkspaceBody({ children, className }: WorkspaceBodyProps) {
  return <section className={`${styles["workspace-body"]} ${className}`}>{children}</section>
}

WorkspaceBody.displayName = "WorkspaceBody"

export default WorkspaceBody
