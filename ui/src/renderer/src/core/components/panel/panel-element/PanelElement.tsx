import styles from "./panel-element.module.css"
import { Children, isValidElement } from "react"
import ElementHeader from "./element-header/ElementHeader"
import ElementList from "./element-list/ElementList"

export default function PanelElement({ children }: { readonly children: React.ReactNode }) {
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
