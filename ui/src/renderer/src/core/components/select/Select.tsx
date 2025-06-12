import styles from "./select.module.css"

interface SelectProps extends React.ComponentProps<"select"> {
  /** The text for a disabled, default option. */
  placeholder?: string
  /** An optional label displayed above the select element. */
  label?: string
  /** An optional CSS class for the wrapper element when a label is present. */
  boxClassName?: string
}

/**
 * A stylized wrapper for the native `<select>` element that adds an optional
 * label and placeholder support. It accepts all standard select attributes.
 *
 * @param {React.ReactNode} props.children - The `<option>` elements to be rendered inside the select dropdown.
 * @param {string} [props.placeholder] - If provided, creates a disabled, default first option with this text.
 * @param {string} [props.label] - If provided, a `<label>` element is rendered wrapping the select box.
 * @param {any} [props.defaultValue] - The default value of the select. If not set, the placeholder value is used.
 * @param {boolean} [props.required=false] - If true, the select input is marked as required.
 * @param {boolean} [props.disabled=false] - If true, the select input is disabled.
 * @param {string} [props.className] - An optional CSS class applied directly to the `<select>` element.
 * @param {string} [props.boxClassName] - An optional CSS class for the wrapper element when a label is present.
 * @param {object} props....props - Any other native `<select>` attributes (e.g., `value`, `onChange`).
 * @returns {React.ReactElement} The rendered select component.
 */
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
}: Readonly<SelectProps>) {
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
