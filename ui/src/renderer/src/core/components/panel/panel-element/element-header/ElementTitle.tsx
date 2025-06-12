import styles from "./element-header.module.css"

interface ElementTitleProps {
  /** Text or elements to display as the title */
  readonly children: React.ReactNode
  /** Optional class name for additional styling */
  readonly className?: string
}

/**
 * A sub-component for `ElementHeader` that renders the title text. It should
 * be used as a child of an `ElementHeader` component.
 *
 * @param {React.ReactNode} props.children - The text or React nodes to be displayed as the title.
 * @param {string} [props.className] - An optional CSS class to apply to the `<h2>` element.
 * @returns {React.ReactElement} The rendered title component.
 */
function ElementTitle({ children, className }: ElementTitleProps) {
  return <h2 className={`${styles.title} ${className}`}>{children}</h2>
}

ElementTitle.displayName = "ElementTitle"
export default ElementTitle
