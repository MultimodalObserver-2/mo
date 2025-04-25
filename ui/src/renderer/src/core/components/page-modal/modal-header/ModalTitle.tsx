import styles from "./modal-header.module.css"

interface ModalTitleProps {
  title: string
  className?: string
  Icon?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  iconClassName?: string
}

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
