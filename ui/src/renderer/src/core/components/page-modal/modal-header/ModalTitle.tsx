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

/**
 * A stylized title component for use within a `ModalHeader`, with support
 * for an optional leading icon.
 *
 * @param {string} props.title - The title text to be displayed.
 * @param {string} [props.className] - An optional CSS class to apply to the `<h2>` title element.
 * @param {React.FunctionComponent<React.SVGProps<SVGSVGElement>>} [props.Icon] - An optional SVG Icon component to be rendered before the title.
 * @param {string} [props.iconClassName] - An optional CSS class to apply to the Icon component.
 * @returns {React.ReactElement} The rendered title component.
 */
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
