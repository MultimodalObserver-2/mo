import styles from "./panel-element.module.css"
import { Children, isValidElement } from "react"
import ElementHeader from "./element-header/ElementHeader"
import ElementList from "./element-list/ElementList"

interface PanelElementProps {
  /** Children elements: expected to include an ElementHeader and an ElementList */
  readonly children: React.ReactNode
}

/** Panel container that organizes a header and a list of elements */
export default function PanelElement({ children }: PanelElementProps) {
  const elements = Children.toArray(children)

  const header = elements.find((child) => isValidElement(child) && child.type === ElementHeader)
  const list = elements.find((child) => isValidElement(child) && child.type === ElementList)

  return (
    <div className={styles.box}>
      {header}
      {list}
    </div>
  )
}
