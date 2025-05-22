import styles from "./plugin-display.module.css"

function PluginDisplayHeader({ title, num }: { title: string; num: number }) {
  return (
    <section className={styles.header}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.num}>{num}</div>
    </section>
  )
}

PluginDisplayHeader.displayName = "PluginDisplayHeader"

export default PluginDisplayHeader
