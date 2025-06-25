import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"
import styles from "./app-shell.module.css"

interface WorkspaceProps {
  readonly children: React.ReactNode
}

export default function Workspace({ children }: WorkspaceProps) {
  const header = findChildByDisplayName(children, "WorkspaceHeader") || (
    <section className={styles["workspace-header"]} />
  )

  const body = findChildByDisplayName(children, "WorkspaceBody") || (
    <section className={styles["workspace-body"]} />
  )

  const footer = findChildByDisplayName(children, "WorkspaceFooter") || (
    <section className={styles["workspace-footer"]} />
  )

  return (
    <div className={styles.workspace}>
      {header}
      {body}
      {footer}
    </div>
  )
}
