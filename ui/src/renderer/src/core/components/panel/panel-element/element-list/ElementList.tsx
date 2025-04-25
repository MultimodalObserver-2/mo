import styles from "./element-list.module.css"

export default function ElementList({ children }: { readonly children: React.ReactNode }) {
  return <ul className={styles.items}>{children}</ul>
}
