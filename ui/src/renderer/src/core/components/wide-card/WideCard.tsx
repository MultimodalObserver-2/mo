import styles from "./wide-card.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

interface WideCardProps extends React.HTMLAttributes<HTMLElement> {}

/**
 * A compound component that creates a stylized wide card layout. It organizes
 * an icon, header, description, and actions into a fixed, structured format.
 *
 * @param {React.ReactNode} props.children - The child elements. Should include instances of `WideCardIcon`, `WideCardHeader`, `WideCardDescription`, and `WideCardActions`.
 * @param {string} [props.className] - An optional CSS class to apply to the main `<article>` container.
 * @param {object} props....props - Any other standard HTML attributes to apply to the `<article>` element.
 * @returns {React.ReactElement} The rendered wide card component.
 */
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
