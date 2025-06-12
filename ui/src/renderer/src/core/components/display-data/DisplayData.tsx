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
  /** Box style types */
  boxStyle?: "vertical" | "horizontal"
}

/**
 * A flexible component for displaying a labeled data point.
 * It can render simple values (string, number), lists of strings,
 * and optional child elements in different layouts.
 *
 * @param {string} props.name - The label to be displayed for the data.
 * @param {string | number | string[]} props.value - The data to display. If it's an array, it will be rendered as a list.
 * @param {React.ReactNode} [props.children] - Optional elements to render below the main value.
 * @param {string} [props.childrenClass] - Optional CSS class for the container of the value and children.
 * @param {"vertical" | "horizontal"} [props.boxStyle="vertical"] - The layout direction of the label and value.
 * @returns {React.ReactElement} The rendered data display component.
 */
export default function DisplayData({
  name,
  value,
  children,
  childrenClass,
  boxStyle = "vertical"
}: Readonly<DisplayDataProps>) {
  return (
    <div
      className={`${styles.box} ${styles[boxStyle]} ${Array.isArray(value) ? styles["list-label-container"] : ""}`}
    >
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
