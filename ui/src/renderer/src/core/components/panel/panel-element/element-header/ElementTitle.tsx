import styles from "./element-header.module.css"

export default function ElementTitle({ children }: { readonly children: React.ReactNode }) {
  return <h2 className={styles.title}>{children}</h2>
}
