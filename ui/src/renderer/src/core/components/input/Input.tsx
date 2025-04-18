import styles from "./input.module.css"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  boxClassName?: string
}

export default function Input({
  label,
  boxClassName = "",
  className = "",
  required = false,
  ...rest
}: InputProps) {
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
