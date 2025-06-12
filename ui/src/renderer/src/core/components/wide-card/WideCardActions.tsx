import styles from "./wide-card.module.css"

interface WideCardActionsProps {
  /** Action elements, such as buttons or icons. */
  children: React.ReactNode
  /** An optional CSS class to apply to the container. */
  className?: string
}

/**
 * A sub-component for `WideCard` that serves as a container for action
 * items like buttons or icons.
 *
 * @param {React.ReactNode} props.children - The action elements to be displayed, such as `Button` components.
 * @param {string} [props.className] - An optional CSS class to apply to the actions' `<div>` container.
 * @returns {React.ReactElement} The rendered card actions component.
 */
function WideCardActions({ children, className }: Readonly<WideCardActionsProps>) {
  return <div className={`${styles.actions} ${className}`}>{children}</div>
}

WideCardActions.displayName = "WideCardActions"
export default WideCardActions
