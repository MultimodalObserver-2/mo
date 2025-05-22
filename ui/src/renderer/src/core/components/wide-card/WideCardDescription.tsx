import styles from "./wide-card.module.css"

function WideCardDescription({
  children,
  className
}: {
  readonly children: React.ReactNode
  readonly className?: string
}) {
  return <p className={`${styles.description} ${className}`}>{children}</p>
}

WideCardDescription.displayName = "WideCardDescription"
export default WideCardDescription
