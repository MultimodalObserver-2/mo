import styles from "./display-data.module.css"

interface DisplayDataProps {
  name: string
  value: string | number | string[]
  children?: React.ReactNode
  childrenClass?: string
}

export default function DisplayData({
  name,
  value,
  children,
  childrenClass
}: Readonly<DisplayDataProps>) {
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
              <li key={`${item}-${idx}`} className={styles.value}>
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
