import styles from "./wide-card.module.css"

interface WideCardProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

function WideCardIcon({ className, ...props }: WideCardProps) {
  return <img className={`${styles.icon} ${className}`} {...props} />
}

WideCardIcon.displayName = "WideCardIcon"
export default WideCardIcon
