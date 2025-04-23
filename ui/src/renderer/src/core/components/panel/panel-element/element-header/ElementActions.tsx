import styles from "./element-header.module.css"

export default function ElementActions({ children }: { children: React.ReactNode }) {
  return <div className={styles.actions}>{children}</div>
}
