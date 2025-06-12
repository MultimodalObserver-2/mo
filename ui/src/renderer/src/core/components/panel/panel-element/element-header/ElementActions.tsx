import styles from "./element-header.module.css"

interface ElementActionsProps {
  /** Action elements such as buttons or icons */
  readonly children: React.ReactNode
  /** Optional class name for additional styling */
  readonly className?: string
}

/**
 * A sub-component for `ElementHeader` that acts as a container for action
 * items, such as buttons or icons. It should be used as a child of an
 * `ElementHeader` component.
 *
 * @param {React.ReactNode} props.children - The action elements (e.g., `Button` components) to be displayed.
 * @param {string} [props.className] - An optional CSS class to apply to the `<div>` container.
 * @returns {React.ReactElement} The rendered actions container component.
 */
function ElementActions({ children, className }: ElementActionsProps) {
  return <div className={`${styles.actions} ${className}`}>{children}</div>
}

ElementActions.displayName = "ElementActions"
export default ElementActions
