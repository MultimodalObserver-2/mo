import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"
import styles from "./app-shell.module.css"

interface WorkspaceProps {
  readonly children: React.ReactNode
  readonly className?: string
}

export default function Workspace({ children, className }: WorkspaceProps) {
  const header = findChildByDisplayName(children, "WorkspaceHeader") || (
    <section className={styles["workspace-header"]} />
  )

  const body = findChildByDisplayName(children, "WorkspaceBody") || (
    <section className={styles["workspace-body"]} />
  )

  const footer = findChildByDisplayName(children, "WorkspaceFooter") || (
    <section className={`${styles["workspace-footer"]} ${styles.bordered}`} />
  )

  return (
    <div className={`${styles.workspace} ${className}`}>
      {header}
      {body}
      {footer}
    </div>
  )
}
