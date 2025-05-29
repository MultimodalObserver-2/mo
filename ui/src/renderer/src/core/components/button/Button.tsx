import styles from "./button.module.css"

type ButtonProps = React.ComponentProps<"button"> & {
  /** Style variant: 'default' | 'danger' | 'soft' */
  styleType?: "default" | "danger" | "soft"
  /** Border radius: 'sm' | "md" | 'xl' */
  borderRadius?: "sm" | "md" | "xl"
  /** Loading state */
  isLoading?: boolean
}

/** Reusable button component with customizable style and shape */
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
