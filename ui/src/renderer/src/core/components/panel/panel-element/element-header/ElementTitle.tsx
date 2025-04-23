import styles from "./element-header.module.css"

export default function ElementTitle({ children }: { children: React.ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>
}
