import CheckIcon from "../icons/CheckIcon"
import styles from "./checkbox.module.css"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

/**
 * A component that renders a checkbox input with a label.
 * @param {React.PropsWithChildren<CheckboxProps>} props - The props for the Checkbox component.
 */
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
