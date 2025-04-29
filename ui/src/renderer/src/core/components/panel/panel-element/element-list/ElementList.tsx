import styles from "./element-list.module.css"

interface ElementListProps {
  /** List items to render inside the element list */
  readonly children: React.ReactNode
}

/** Unordered list container for grouping related elements */
export default function ElementList({ children }: ElementListProps) {
  return <ul className={styles.items}>{children}</ul>
}
