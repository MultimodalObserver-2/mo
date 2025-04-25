import styles from "./display-data.module.css"

export default function DisplayData({
  name,
  value,
  children,
  childrenClass
}: {
  name: string
  value: string | number | string[]
  children?: React.ReactNode
  childrenClass?: string
}) {
  return (
    <div className={`${styles.box}  ${Array.isArray(value) ? styles["list-label-container"] : ""}`}>
      <div className={styles.label}>
        <span className={styles.bullet}></span>
        <h4 className={styles.name}>{name}</h4>
      </div>
      <div className={`${childrenClass} ${Array.isArray(value) ? styles["list-container"] : ""}`}>
        {Array.isArray(value) ? (
          <ul className={styles.list}>
            {value.map((item, idx) => (
              <li key={idx} className={styles.value}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.value}>{value}</p>
        )}
        {children}
      </div>
    </div>
  )
}
