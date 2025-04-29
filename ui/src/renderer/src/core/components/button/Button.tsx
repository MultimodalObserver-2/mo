import styles from "./button.module.css"

type ButtonProps = React.ComponentProps<"button"> & {
  /** Style variant: 'default' | 'danger' | 'soft' */
  styleType?: "default" | "danger" | "soft"
  /** Border radius: 'sm' or 'xl' */
  borderRadius?: "sm" | "xl"
}

/** Reusable button component with customizable style and shape */
export default function Button({
  className = "",
  children,
  styleType = "default",
  borderRadius = "sm",
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${className} ${styles.button} ${styles[styleType]} ${styles[borderRadius]}`}
      {...rest}
    >
      {children}
    </button>
  )
}
