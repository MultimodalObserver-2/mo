import styles from "./display-data.module.css"

interface BulletLabelProps {
  /** The text content to be displayed next to the bullet point. */
  label: string
}

/**
 * A simple UI component that displays a text label preceded by a decorative bullet point.
 *
 * @param {string} props.label - The text to be displayed.
 * @returns {React.ReactElement} The rendered label with a bullet.
 */
export default function BulletLabel({ label }: Readonly<BulletLabelProps>) {
  return (
    <div className={styles.label}>
      <span className={styles.bullet}></span>
      <h4 className={styles.name}>{label}</h4>
    </div>
  )
}
