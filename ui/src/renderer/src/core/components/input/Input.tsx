import styles from "./input.module.css"

interface InputProps extends React.ComponentProps<"input"> {
  /** Optional label displayed above the input */
  label?: string
  /** Optional custom class for the label container */
  boxClassName?: string
}

/** Reusable input component with optional label and styling support */
export default function Input({
  label,
  boxClassName = "",
  className = "",
  required = false,
  disabled = false,
  ref,
  ...rest
}: InputProps) {
  if (label == undefined) {
    return (
      <input
        ref={ref}
        className={`${className} ${styles.input}`}
        required={required}
        disabled={disabled}
        {...rest}
      />
    )
  }

  return (
    <label className={`${boxClassName} ${styles["label-box"]} ${disabled ? styles.disabled : ""}`}>
      <h4 className={styles.label}>
        {label} {required && <b className={styles.required}>*</b>}
      </h4>
      <input
        ref={ref}
        className={`${className} ${styles.input}`}
        required={required}
        disabled={disabled}
        {...rest}
      />
    </label>
  )
}
