import styles from "./element-header.module.css"

interface ElementActionsProps {
  /** Action elements such as buttons or icons */
  readonly children: React.ReactNode
  /** Optional class name for additional styling */
  readonly className?: string
}

/** Container for action buttons or icons within a list header */
function ElementActions({ children, className }: ElementActionsProps) {
  return <div className={`${styles.actions} ${className}`}>{children}</div>
}

ElementActions.displayName = "ElementActions"
export default ElementActions
