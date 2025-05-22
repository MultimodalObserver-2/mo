import styles from "./element-header.module.css"

interface ElementTitleProps {
  /** Text or elements to display as the title */
  readonly children: React.ReactNode
  /** Optional class name for additional styling */
  readonly className?: string
}

/** Title element for section headers inside list panels */
function ElementTitle({ children, className }: ElementTitleProps) {
  return <h2 className={`${styles.title} ${className}`}>{children}</h2>
}

ElementTitle.displayName = "ElementTitle"
export default ElementTitle
