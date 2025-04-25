import styles from "./modal-body.module.css"

interface ModalBodyProps {
  children: React.ReactNode
  className?: string
  type?: "default" | "form"
  id?: string
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
}

export default function ModalBody({
  children,
  className,
  type = "default",
  id,
  onSubmit
}: Readonly<ModalBodyProps>) {
  if (type === "form") {
    return (
      <form id={id} className={`${styles.body} ${className}`} onSubmit={onSubmit}>
        {children}
      </form>
    )
  }
  return (
    <section id={id} className={`${styles.body} ${className}`}>
      {children}
    </section>
  )
}
