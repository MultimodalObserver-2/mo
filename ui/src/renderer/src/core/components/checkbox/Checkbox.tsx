import CheckIcon from "../icons/CheckIcon"
import styles from "./checkbox.module.css"

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

/**
 * A component that renders a stylized checkbox input with a corresponding label.
 * It functions as a wrapper around the native HTML input element, providing custom styling.
 *
 * @param {React.ReactNode} props.children - The content to be displayed as the label for the checkbox.
 * @param {string} [props.className] - Additional CSS classes to apply to the root <label> element for custom styling.
 * @param {object} props.rest - Any other standard HTML input attributes (e.g., `checked`, `onChange`, `disabled`, `name`). These are passed directly to the underlying <input> element.
 *
 * @returns {React.ReactElement} The rendered checkbox component.
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
