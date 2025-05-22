import styles from "./wide-card.module.css"

function WideCardHeader({
  children,
  className
}: {
  readonly children: React.ReactNode
  readonly className?: string
}) {
  return <div className={`${styles.header} ${className}`}>{children}</div>
}

WideCardHeader.displayName = "WideCardHeader"
export default WideCardHeader
