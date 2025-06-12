import styles from "./modal-header.module.css"

interface ModalHeaderProps {
  /** Content to display in the modal header (typically a title or actions) */
  children: React.ReactNode
  /** Optional class name for additional styling */
  className?: string
}

/**
 * A sub-component for `PageModal` that serves as the header container.
 * It typically holds the modal's title, such as a `ModalTitle` component.
 *
 * @param {React.ReactNode} props.children - The content to display in the header, usually a `ModalTitle` component.
 * @param {string} [props.className] - An optional CSS class to apply to the header's container element.
 * @returns {React.ReactElement} The rendered modal header component.
 */
export default function ModalHeader({ children, className }: Readonly<ModalHeaderProps>) {
  return <section className={`${styles.header} ${className}`}>{children}</section>
}
