import { ChangeEvent, useState } from "react"
import styles from "./list-input.module.css"
import AddCircleIcon from "../icons/AddCircleIcon"
import DeleteIcon from "../icons/DeleteIcon"

interface ListInputProps {
  label?: string
  placeholder?: string
  boxClassName?: string
  className?: string
  name?: string
  required?: boolean
  defaultValue?: string[]
  value?: string[]
  onChange?: (value: string[]) => void
}

export default function ListInput({
  label,
  placeholder = "",
  boxClassName = "",
  className = "",
  name = "",
  required = false,
  defaultValue = [""],
  onChange = () => {}
}: ListInputProps) {
  const [inputValues, setInputValues] = useState(defaultValue)

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

  const renderInputs = () =>
    inputValues.map((val, idx) => (
      <li className={styles.item} key={idx}>
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

  if (label == undefined) {
    return (
      <ul className={`${boxClassName} ${styles.list}`}>
        {renderInputs()}
        <input type="hidden" name={name} value={JSON.stringify(inputValues)} />
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
        <input type="hidden" name={name} value={JSON.stringify(inputValues)} />
      </ul>
    </div>
  )
}
