import styles from "./element-header.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

interface ElementHeaderProps {
  /** Children should include an ElementTitle and optionally ElementActions */
  readonly children: React.ReactNode
  /** Optional class name for additional styling */
  readonly className?: string
}

/** Header section for list elements; displays title and optional actions */
function ElementHeader({ children, className }: ElementHeaderProps) {
  const title = findChildByDisplayName(children, "ElementTitle")
  const actions = findChildByDisplayName(children, "ElementActions")

  return (
    <section className={`${styles.header} ${className}`}>
      {title}
      {actions}
    </section>
  )
}

ElementHeader.displayName = "ElementHeader"
export default ElementHeader
