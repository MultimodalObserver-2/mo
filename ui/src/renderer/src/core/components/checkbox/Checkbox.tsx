import CheckIcon from "../icons/CheckIcon"
import styles from "./checkbox.module.css"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

export default function Checkbox({ children, className, ...rest }: Readonly<CheckboxProps>) {
  return (
    <label className={`${styles.label} ${className}`}>
      <div className={styles["checkbox-box"]}>
        <input type="checkbox" className={styles.checkbox} {...rest} />
        <CheckIcon className={styles.icon} />
      </div>
      {children}
    </label>
  )
}
