import { Children } from "react"
import styles from "./plugin-display.module.css"

function PluginDisplayList({
  children,
  className,
  selectable = false
}: {
  readonly children?: React.ReactNode
  readonly className?: string
  readonly selectable?: boolean
}) {
  if (Children.count(children) === 0) {
    return (
      <article className={`${styles.plugins} ${className}`}>
        <h3 className={styles.empty}>No plugins found</h3>
      </article>
    )
  }

  return (
    <section className={`${styles.plugins} ${className} ${selectable ? styles.selectable : ""}`}>
      {children}
    </section>
  )
}

PluginDisplayList.displayName = "PluginDisplayList"

export default PluginDisplayList
