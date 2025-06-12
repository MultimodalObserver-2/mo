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

/**
 * A sub-component for `PageModal` that acts as the main content container.
 * It can render as a standard `<section>` or as a `<form>` to handle data submission.
 *
 * @param {React.ReactNode} props.children - The content to be rendered inside the modal body.
 * @param {string} [props.className] - An optional CSS class to apply to the container element.
 * @param {"default" | "form"} [props.type="default"] - Determines the container element. 'form' renders a `<form>`, 'default' renders a `<section>`.
 * @param {string} [props.id] - An optional ID to apply to the rendered container or form/section element.
 * @param {(e: React.FormEvent<HTMLFormElement>) => void} [props.onSubmit] - The callback for the `onSubmit` event, used only when `type` is 'form'.
 * @returns {React.ReactElement} The rendered modal body component.
 */
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
