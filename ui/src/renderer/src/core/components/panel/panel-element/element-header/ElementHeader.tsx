import styles from "./element-header.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

interface ElementHeaderProps {
  /** Children should include an ElementTitle and optionally ElementActions */
  readonly children: React.ReactNode
  /** Optional class name for additional styling */
  readonly className?: string
}

/**
 * A sub-component for `PanelElement` that serves as its header. It is a
 * compound component that expects `ElementTitle` and `ElementActions` as
 * children, arranging them in a consistent layout.
 *
 * @param {React.ReactNode} props.children - The child elements. Should include an `ElementTitle` and optionally an `ElementActions` instance.
 * @param {string} [props.className] - An optional CSS class to apply to the header's `<section>` container.
 * @returns {React.ReactElement} The rendered element header component.
 */
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
