import styles from "./input.module.css"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
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
  ...rest
}: Readonly<InputProps>) {
  return (
    <>
      {label != undefined ? (
        <label className={`${boxClassName} ${styles["label-box"]}`}>
          <h4 className={styles.label}>
            {label} {required && <b className={styles.required}>*</b>}
          </h4>
          <input className={`${className} ${styles.input}`} required={required} {...rest} />
        </label>
      ) : (
        <input className={`${className} ${styles.input}`} {...rest} />
      )}
    </>
  )
}
