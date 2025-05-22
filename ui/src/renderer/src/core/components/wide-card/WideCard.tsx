import styles from "./wide-card.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

interface WideCardProps extends React.HTMLAttributes<HTMLElement> {}

export default function WideCard({ children, className, ...props }: Readonly<WideCardProps>) {
  const icon = findChildByDisplayName(children, "WideCardIcon")
  const header = findChildByDisplayName(children, "WideCardHeader")
  const actions = findChildByDisplayName(children, "WideCardActions")
  const description = findChildByDisplayName(children, "WideCardDescription")

  return (
    <article className={`${styles.card} ${className}`} {...props}>
      {icon}
      <div className={styles.content}>
        <section className={styles.top}>
          {header}
          {actions}
        </section>
        {description}
      </div>
    </article>
  )
}
