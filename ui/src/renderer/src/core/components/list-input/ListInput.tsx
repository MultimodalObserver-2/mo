import { ChangeEvent, useState } from "react"
import styles from "./list-input.module.css"
import AddCircleIcon from "../icons/AddCircleIcon"
import DeleteIcon from "../icons/DeleteIcon"

interface ListInputProps {
  /** Optional label displayed above the list */
  label?: string
  /** Placeholder for the first input field */
  placeholder?: string
  /** Optional class for the outer container */
  boxClassName?: string
  /** Optional class for each input element */
  className?: string
  /** Name used in hidden input for form serialization */
  name?: string
  /** Whether at least one input is required */
  required?: boolean
  /** Initial list of values */
  defaultValue?: string[]
  /** Callback when any input changes */
  onChange?: (value: string[]) => void
}

/**
 * A stylized component that renders a dynamic list of text inputs, allowing
 * users to add or remove fields. It serializes the list into a hidden input
 * for easy form submission.
 *
 * @param {string} [props.label] - An optional label displayed above the entire list.
 * @param {string} [props.placeholder=""] - Placeholder text for the first input field.
 * @param {string} [props.boxClassName=""] - An optional CSS class for the main container element.
 * @param {string} [props.className=""] - An optional CSS class applied to each individual `<input>` element.
 * @param {string} [props.name=""] - The base name for form submission and unique key generation.
 * @param {boolean} [props.required=false] - If true, the first input is marked as required.
 * @param {string[]} [props.defaultValue=[""]] - The initial list of values for the inputs.
 * @param {(value: string[]) => void} [props.onChange] - A callback that fires with the updated list of values on any change.
 * @returns {React.ReactElement} The rendered dynamic list input component.
 */
export default function ListInput({
  label,
  placeholder = "",
  boxClassName = "",
  className = "",
  name = "",
  required = false,
  defaultValue = [""],
  onChange = () => {}
}: Readonly<ListInputProps>) {
  const [inputValues, setInputValues] = useState(defaultValue.length > 0 ? defaultValue : [""])

  const handleAddNote = () => {
    setInputValues((prev) => [...prev, ""])
  }

  const handleDeleteNote = (idx: number) => {
    if (idx === 0 && inputValues.length === 1) {
      setInputValues([""])
      return
    }
    setInputValues((prev) => prev.filter((_, index) => index !== idx))
  }

  const handleInputChange = (idx: number, event: ChangeEvent<HTMLInputElement>) => {
    const newValues = [...inputValues]
    newValues[idx] = event.target.value
    setInputValues(newValues)
    onChange(newValues)
  }

  const renderInputs = () => {
    return inputValues.map((val, idx) => (
      <li className={styles.item} key={`${name}-${idx}`}>
        <input
          id={`${name}-${idx}`}
          className={`${className} ${styles.input}`}
          required={required}
          placeholder={idx == 0 ? placeholder : ""}
          value={val}
          onChange={(e) => {
            handleInputChange(idx, e)
          }}
        />
        <DeleteIcon className={styles["delete-button"]} onClick={() => handleDeleteNote(idx)} />
      </li>
    ))
  }

  const clearInputValue = (values: string[]) => {
    const newValues = values.filter((val) => val.replace(/\s/g, "").length > 0)
    return newValues
  }

  if (label == undefined) {
    return (
      <ul className={`${boxClassName} ${styles.list}`}>
        {renderInputs()}
        <input type="hidden" name={name} value={JSON.stringify(clearInputValue(inputValues))} />
      </ul>
    )
  }

  return (
    <div className={`${boxClassName} ${styles["list-input"]}`}>
      <div className={styles.top}>
        <label htmlFor={`${name}-${inputValues.length - 1}`}>
          <h4 className={styles.label}>
            {label} {required && <b className={styles.required}>*</b>}
          </h4>
        </label>
        <AddCircleIcon className={styles["add-button"]} onClick={handleAddNote} />
      </div>
      <ul className={styles.list}>
        {renderInputs()}
        <input type="hidden" name={name} value={JSON.stringify(clearInputValue(inputValues))} />
      </ul>
    </div>
  )
}
