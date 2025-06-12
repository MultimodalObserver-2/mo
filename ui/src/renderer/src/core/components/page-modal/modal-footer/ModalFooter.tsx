import styles from "./modal-footer.module.css"

interface ModalFooterProps {
  /** Content to display in the modal footer (e.g., buttons or actions) */
  children: React.ReactNode
  /** Optional class name for custom styling */
  className?: string
}

/**
 * A sub-component for `PageModal` that serves as the footer container.
 * It is typically used to hold action buttons like 'Submit' or 'Cancel'.
 *
 * @param {React.ReactNode} props.children - The content to display in the footer, usually one or more `Button` components.
 * @param {string} [props.className] - An optional CSS class to apply to the footer's container element.
 * @returns {React.ReactElement} The rendered modal footer component.
 */
export default function ModalFooter({ children, className }: Readonly<ModalFooterProps>) {
  return <section className={`${styles.footer} ${className}`}>{children}</section>
}
