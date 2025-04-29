import styles from "./modal-body.module.css"

interface ModalBodyProps {
  /** Content to render inside the modal body */
  children: React.ReactNode
  /** Optional class name for styling */
  className?: string
  /** Body type: renders as 'form' or regular section */
  type?: "default" | "form"
  /** Optional id for the container or form */
  id?: string
  /** Submit handler (only used if type is 'form') */
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void
}

/** Modal body container; renders as a <form> if type is 'form', otherwise as a <section> */
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
