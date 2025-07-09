import styles from "./input.module.css"

interface InputProps extends React.ComponentProps<"input"> {
  /** Optional label displayed above the input */
  label?: string
  /** Optional custom class for the label container */
  boxClassName?: string
  styleType?: "primary-dark" | "primary"
}

/**
 * A versatile and stylized wrapper for the native `<input>` element that adds
 * an optional label, custom styling hooks, and forwards all standard input attributes.
 *
 * @param {string} [props.label] - If provided, a `<label>` element is rendered wrapping the input.
 * @param {string} [props.boxClassName=""] - An optional CSS class for the wrapper element when a label is present.
 * @param {string} [props.className=""] - An optional CSS class applied directly to the `<input>` element.
 * @param {boolean} [props.required=false] - If true, the input is marked as required, and an asterisk is shown in the label.
 * @param {boolean} [props.disabled=false] - If true, both the input and the label are styled as disabled.
 * @param {React.Ref<HTMLInputElement>} [props.ref] - A ref to be forwarded to the underlying `<input>` element.
 * @param {object} props....rest - Any other native `<input>` attributes (e.g., `type`, `value`, `placeholder`, `onChange`).
 * @returns {React.ReactElement} The rendered input component.
 */
export default function Input({
  label,
  boxClassName = "",
  className = "",
  styleType = "primary-dark",
  required = false,
  disabled = false,
  ref,
  ...rest
}: Readonly<InputProps>) {
  if (label == undefined) {
    return (
      <input
        ref={ref}
        className={`${className} ${styles.input} ${styles[styleType]}`}
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
