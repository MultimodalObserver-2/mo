import styles from "./button.module.css"

type ButtonProps = React.ComponentProps<"button"> & {
  styleType?: "default" | "danger" | "soft"
  borderRadius?: "sm" | "xl"
}

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
