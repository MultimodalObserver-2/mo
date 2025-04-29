import styles from "./modal-footer.module.css"

interface ModalFooterProps {
  /** Content to display in the modal footer (e.g., buttons or actions) */
  children: React.ReactNode
  /** Optional class name for custom styling */
  className?: string
}

/** Footer section of the modal, typically used for action buttons */
export default function ModalFooter({ children, className }: Readonly<ModalFooterProps>) {
  return <section className={`${styles.footer} ${className}`}>{children}</section>
}
