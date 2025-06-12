import styles from "./panel-element.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

interface PanelElementProps {
  /** Children elements: expected to include an ElementHeader and an ElementList */
  readonly children: React.ReactNode
  /** Additional CSS classes for the panel element */
  readonly className?: string
}

/**
 * A sub-component for `Panel` that organizes content into a header and a list.
 * It acts as a compound component, expecting `ElementHeader` and `ElementList`
 * as children, and arranges them in a fixed layout.
 *
 * @param {React.ReactNode} props.children - The child elements. Should include one `ElementHeader` and one `ElementList` instance.
 * @param {string} [props.className] - An optional CSS class to apply to the main container `div`.
 * @returns {React.ReactElement} The rendered panel element component.
 */
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
