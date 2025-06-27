import styles from "./app-shell.module.css"

interface WorkspaceFooterProps {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly borderless?: boolean
}

function WorkspaceFooter({ children, className, borderless = false }: WorkspaceFooterProps) {
  return (
    <section
      className={`${styles["workspace-footer"]} ${borderless ? "" : styles.bordered} ${className}`}
    >
      {children}
    </section>
  )
}

WorkspaceFooter.displayName = "WorkspaceFooter"

export default WorkspaceFooter
