import { useRef } from "react"
import Button from "../button/Button"
import DocumentSearchIcon from "../icons/DocumentSearchIcon"
import Input from "../input/Input"
import styles from "./path-input.module.css"

interface PathInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input */
  label?: string
  /** Optional custom class for the label container */
  boxClassName?: string
  /** Optional file type input for validation*/
  fileTypes?: string[]
}

/**
 * A stylized input component for selecting file paths. It includes a button
 * that opens the native file system dialog, allowing users to browse for and
 * select a file.
 *
 * @param {string} [props.label] - An optional label displayed above the input.
 * @param {string} [props.boxClassName=""] - An optional CSS class for the main label container.
 * @param {string} [props.className=""] - An optional CSS class applied to the underlying `<Input>` component.
 * @param {boolean} [props.required=false] - If true, the input is marked as required.
 * @param {boolean} [props.disabled=false] - If true, the input and browse button are disabled.
 * @param {string | number | readonly string[]} [props.value] - The controlled value of the input.
 * @param {string | number | readonly string[]} [props.defaultValue] - The default value for uncontrolled usage.
 * @param {(event: React.ChangeEvent<HTMLInputElement>) => void} [props.onChange] - Callback that fires when the value changes.
 * @param {string[]} [props.fileTypes] - File extensions (e.g., 'png', 'txt') to filter by in the dialog.
 * @param {object} props....props - Any other native `<input>` attributes passed to the `Input` component.
 * @returns {React.ReactElement} The rendered path input component.
 */
export default function PathInput({
  label,
  boxClassName = "",
  className = "",
  required = false,
  disabled = false,
  value,
  defaultValue,
  onChange,
  fileTypes,
  ...props
}: Readonly<PathInputProps>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleSearchLocation = async () => {
    const pathValue = value || defaultValue || ""
    const filters: NonNullable<Electron.OpenDialogOptions["filters"]> = []
    if (fileTypes) {
      filters.push({ name: "Files", extensions: fileTypes })
    }
    const result = await window.core.dialog.showOpenDialog({
      title: "Search for a file",
      defaultPath: String(pathValue),
      filters: filters,
      properties: ["openFile"]
    })
    if (result.canceled) {
      return
    }
    const selectedPath = result.filePaths[0]
    if (!value && inputRef.current) {
      inputRef.current.value = selectedPath
    }
    if (onChange) {
      onChange({ target: { value: selectedPath } } as React.ChangeEvent<HTMLInputElement>)
    }
  }

  return (
    <label className={`${boxClassName} ${styles["label-box"]} ${disabled ? styles.disabled : ""}`}>
      <h4 className={styles.label}>
        {label} {required && <b className={styles.required}>*</b>}
      </h4>
      <div className={styles.inputs}>
        <Input
          ref={inputRef}
          className={className}
          type="text"
          required={required}
          disabled={disabled}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          {...props}
        />
        <Button
          type="button"
          className={styles.button}
          styleType="soft"
          onClick={handleSearchLocation}
        >
          <DocumentSearchIcon className={styles.icon} />
        </Button>
      </div>
    </label>
  )
}
