import BulletLabel from "./BulletLabel"
import styles from "./display-data.module.css"

interface DisplayDataProps {
  /** Label shown above the value */
  name: string
  /** Value to display; can be string, number or list of strings */
  value: string | number | string[]
  /** Optional children rendered below the value */
  children?: React.ReactNode
  /** Optional CSS class for the value container */
  childrenClass?: string
}

/** Displays a labeled value (string, number or list) with optional children */
export default function DisplayData({
  name,
  value,
  children,
  childrenClass
}: Readonly<DisplayDataProps>) {
  return (
    <div className={`${styles.box}  ${Array.isArray(value) ? styles["list-label-container"] : ""}`}>
      <BulletLabel label={name} />
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
