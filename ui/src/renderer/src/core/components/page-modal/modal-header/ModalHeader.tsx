import styles from "./modal-header.module.css"

interface ModalHeaderProps {
  /** Content to display in the modal header (typically a title or actions) */
  children: React.ReactNode
  /** Optional class name for additional styling */
  className?: string
}

/** Section wrapper for modal header content */
export default function ModalHeader({ children, className }: Readonly<ModalHeaderProps>) {
  return <section className={`${styles.header} ${className}`}>{children}</section>
}
