import styles from "./display-data.module.css"

export default function DisplayData({
  name,
  value,
  children,
  childrenClass
}: {
  name: string
  value: string | number
  children?: React.ReactNode
  childrenClass?: string
}) {
  return (
    <div className={styles.box}>
      <div className={styles.label}>
        <span className={styles.bullet}></span>
        <h4 className={styles.name}>{name}</h4>
      </div>
      <div className={childrenClass}>
        <p className={styles.value}>{value}</p>
        {children}
      </div>
    </div>
  )
}
