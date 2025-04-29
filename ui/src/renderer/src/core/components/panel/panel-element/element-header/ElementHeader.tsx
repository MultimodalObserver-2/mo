import styles from "./element-header.module.css"
import { Children, isValidElement } from "react"
import ElementTitle from "./ElementTitle"
import ElementActions from "./ElementActions"

interface ElementHeaderProps {
  /** Children should include an ElementTitle and optionally ElementActions */
  readonly children: React.ReactNode
}

/** Header section for list elements; displays title and optional actions */
export default function ElementHeader({ children }: ElementHeaderProps) {
  const elements = Children.toArray(children)
  const title = elements.find((child) => isValidElement(child) && child.type === ElementTitle)
  const actions = elements.find((child) => isValidElement(child) && child.type === ElementActions)

  return (
    <section className={styles.header}>
      {title}
      {actions}
    </section>
  )
}
