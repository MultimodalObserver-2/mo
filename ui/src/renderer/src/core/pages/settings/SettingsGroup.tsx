import styles from "./settings.module.css"

interface SettingsGroupProps {
  title: string
  children?: React.ReactNode
}

export default function SettingsGroup({ title, children }: Readonly<SettingsGroupProps>) {
  return (
    <section className={styles["settings-group"]}>
      <h2 className={styles["group-title"]}>{title}</h2>
      <div className={styles["group"]}>{children}</div>
    </section>
  )
}
