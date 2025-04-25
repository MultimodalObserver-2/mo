import styles from "./modal-header.module.css"

interface ModalHeaderProps {
  children: React.ReactNode
  className?: string
}

export default function ModalHeader({ children, className }: Readonly<ModalHeaderProps>) {
  return <section className={`${styles.header} ${className}`}>{children}</section>
}
