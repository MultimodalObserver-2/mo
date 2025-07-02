import styles from "./button.module.css"

type ButtonProps = React.ComponentProps<"button"> & {
  /** The visual style of the button */
  styleType?: "default" | "danger" | "soft" | "extra-soft" | "primary-light"
  /** The border radius of the button */
  borderRadius?: "sm" | "md" | "xl"
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean
}

/**
 * A reusable button component with customizable style and shape.
 * It accepts all standard props of a native HTML button.
 *
 * @param {string} [props.className=""] - Additional classes for custom styling.
 * @param {React.ReactNode} props.children - The content to be displayed inside the button.
 * @param {"default" | "danger" | "soft" | "extra-soft" | "accent-dark"} [props.styleType="default"] - The visual variant of the button.
 * - 'default': Standard button
 * - 'danger': Warning/destructive actions
 * - 'soft': Muted background
 * - 'extra-soft': Even lighter background
 * - 'primary-light': Light primary button
 * @param {"sm" | "md" | "xl"} [props.borderRadius="sm"] - Defines the border radius.
 * - 'sm': Small radius
 * - 'md': Medium radius
 * - 'xl': Fully rounded
 * @param {boolean} [props.isLoading=false] - If true, displays a loading spinner.
 * @param {boolean} [props.disabled=false] - If true, the button is disabled. It's also disabled when isLoading is true.
 * @param {object} props.rest - Other native button props like onClick, etc.
 *
 * @returns {React.ReactElement} The rendered button component.
 */
export default function Button({
  className = "",
  children,
  styleType = "default",
  borderRadius = "sm",
  isLoading = false,
  disabled = false,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${className} ${styles.button} ${isLoading ? styles.loading : ""} ${styles[styleType]} ${styles[borderRadius]}`}
      disabled={disabled || isLoading}
      {...rest}
    >
      {children}
      {isLoading && (
        <div className={styles.loader}>
          <div className={styles.circle}></div>
        </div>
      )}
    </button>
  )
}


