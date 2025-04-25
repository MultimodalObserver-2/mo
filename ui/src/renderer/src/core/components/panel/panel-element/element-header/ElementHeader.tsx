import styles from "./element-header.module.css"
import { Children, isValidElement } from "react"
import ElementTitle from "./ElementTitle"
import ElementActions from "./ElementActions"

export default function ElementHeader({ children }: { readonly children: React.ReactNode }) {
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
