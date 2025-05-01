import styles from "./element-list.module.css"

interface ElementListProps {
  /** List items to render inside the element list */
  readonly children: React.ReactNode
  /** Additional CSS classes for the element list */
  readonly className?: string
  readonly id?: string
}

/** Unordered list container for grouping related elements */
export default function ElementList({ children, className, id = "" }: ElementListProps) {
  return (
    <ul id={id} className={`${styles.items} ${className}`}>
      {children}
    </ul>
  )
}
