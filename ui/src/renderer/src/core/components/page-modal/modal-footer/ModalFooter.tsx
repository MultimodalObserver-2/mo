import styles from "./modal-footer.module.css"

interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

export default function ModalFooter({ children, className }: ModalFooterProps) {
  return <section className={`${styles.footer} ${className}`}>{children}</section>
}
