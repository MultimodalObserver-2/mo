import styles from "./panel-element.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

interface PanelElementProps {
  /** Children elements: expected to include an ElementHeader and an ElementList */
  readonly children: React.ReactNode
  /** Additional CSS classes for the panel element */
  readonly className?: string
}

/** Panel container that organizes a header and a list of elements */
export default function PanelElement({ children, className }: PanelElementProps) {
  const header = findChildByDisplayName(children, "ElementHeader")
  const list = findChildByDisplayName(children, "ElementList")

  return (
    <div className={`${styles.box} ${className}`}>
      {header}
      {list}
    </div>
  )
}
