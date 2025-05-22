import styles from "./wide-card.module.css"

function WideCardActions({
  children,
  className
}: {
  readonly children: React.ReactNode
  readonly className?: string
}) {
  return <div className={`${styles.actions} ${className}`}>{children}</div>
}

WideCardActions.displayName = "WideCardActions"
export default WideCardActions
