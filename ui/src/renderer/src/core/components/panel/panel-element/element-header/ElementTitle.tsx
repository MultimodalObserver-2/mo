import styles from "./element-header.module.css"

interface ElementTitleProps {
  /** Text or elements to display as the title */
  readonly children: React.ReactNode
}

/** Title element for section headers inside list panels */
export default function ElementTitle({ children }: ElementTitleProps) {
  return <h2 className={styles.title}>{children}</h2>
}
