import styles from "./modal-header.module.css"

interface ModalTitleProps {
  /** Title text to display */
  title: string
  /** Optional class for the title element */
  className?: string
  /** Optional icon component rendered before the title */
  Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  /** Optional class for the icon element */
  iconClassName?: string
}

/** Title section for a modal, optionally with a leading icon */
export default function ModalTitle({
  title,
  className,
  Icon,
  iconClassName
}: Readonly<ModalTitleProps>) {
  return (
    <>
      {Icon && <Icon className={`${styles.icon} ${iconClassName}`} />}
      <h2 className={`${styles.title} ${className}`}>{title}</h2>
    </>
  )
}
