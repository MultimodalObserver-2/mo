import styles from "./display-data.module.css"

export default function BulletLabel({ label }: { label: string }) {
  return (
    <div className={styles.label}>
      <span className={styles.bullet}></span>
      <h4 className={styles.name}>{label}</h4>
    </div>
  )
}
