import styles from "./select.module.css"

interface SelectProps extends React.ComponentProps<"select"> {
  placeholder?: string
  label?: string
  boxClassName?: string
}

export default function Select({
  children,
  placeholder,
  label,
  defaultValue,
  required = false,
  disabled = false,
  className,
  boxClassName,
  ...props
}: SelectProps) {
  if (label == undefined) {
    return (
      <select
        className={`${styles.select} ${className}`}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue || placeholder}
        {...props}
      >
        {placeholder && (
          <option value={placeholder} disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    )
  }

  return (
    <label className={`${styles["label-box"]} ${boxClassName} ${disabled ? styles.disabled : ""}`}>
      <h4 className={styles.label}>
        {label} {required && <b className={styles.required}>*</b>}
      </h4>
      <select
        className={`${styles.select} ${className}`}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue || placeholder}
        {...props}
      >
        {placeholder && (
          <option value={placeholder} disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
    </label>
  )
}
