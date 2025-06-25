import styles from "./app-shell.module.css"

interface WorkspaceBodyProps {
  readonly children?: React.ReactNode
}

function WorkspaceBody({ children }: WorkspaceBodyProps) {
  return <section className={styles["workspace-body"]}>{children}</section>
}

WorkspaceBody.displayName = "WorkspaceBody"

export default WorkspaceBody
