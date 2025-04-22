import styles from "./element-header.module.css"
import { Children, isValidElement, ReactNode } from "react"

export const ElementTitle = ({ children }: { children: ReactNode }) => (
  <h2 className={styles.title}>{children}</h2>
)

export const ElementActions = ({ children }: { children: ReactNode }) => (
  <div className={styles.actions}>{children}</div>
)

export function ElementHeader({ children }: { children: ReactNode }) {
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
