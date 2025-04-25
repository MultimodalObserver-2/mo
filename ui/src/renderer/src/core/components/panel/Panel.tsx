import styles from "./panel.module.css"

export default function Panel({ children }: { readonly children: React.ReactNode }) {
  return <section className={styles.panel}>{children}</section>
}
