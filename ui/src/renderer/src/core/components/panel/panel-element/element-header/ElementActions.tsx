import styles from "./element-header.module.css"

interface ElementActionsProps {
  /** Action elements such as buttons or icons */
  readonly children: React.ReactNode
}

/** Container for action buttons or icons within a list header */
export default function ElementActions({ children }: ElementActionsProps) {
  return <div className={styles.actions}>{children}</div>
}
