import UploadFileIcon from "../icons/UploadFileIcon"
import styles from "./file-upload.module.css"
import useUpload from "./useUpload"

interface FileUploadProps {
  /** The ID for the file input element and its associated label. */
  id?: string
  /** The name attribute for the file input, used in form submission. */
  name?: string
  /** An array of accepted file types (e.g., ['.jpg', 'image/*']). */
  accept?: string[]
  /** If true, allows selecting multiple files. */
  multiple?: boolean
  /** If true, the file input is required for form submission. */
  required?: boolean
  /** An array of File objects. Providing this makes the component "controlled". */
  files?: File[]
  /** Callback function invoked when files are selected or changed. */
  onChangeFiles?: (files: File[]) => void
}

/**
 * A user-friendly file upload component that supports drag-and-drop and
 * traditional file Browse. It can be used as a controlled component to manage
 * the file list state from a parent.
 *
 * @param {string} [props.id="file"] - The ID for the underlying file input.
 * @param {string} [props.name] - The name attribute for the file input.
 * @param {string[]} [props.accept] - An array of accepted file type specifiers.
 * @param {boolean} [props.multiple=false] - If true, allows multiple file selection.
 * @param {boolean} [props.required=false] - If true, the input is required for form submission.
 * @param {File[]} [props.files=[]] - The list of currently selected files for controlled usage.
 * @param {(files: File[]) => void} [props.onChangeFiles] - The callback function to handle file changes.
 * @returns {React.ReactElement} The rendered file upload component.
 */
export default function FileUpload({
  id = "file",
  name,
  accept,
  multiple = false,
  required = false,
  files = [],
  onChangeFiles
}: FileUploadProps) {
  const upload = useUpload(accept, multiple, files, onChangeFiles)

  const acceptedFilesText = () => {
    if (accept?.length === 0) {
      return "All file types are accepted"
    }
    return "The following file types are accepted: " + accept?.join(", ")
  }

  return (
    <div className={styles.container}>
      <div
        className={`${styles["upload-zone"]}
                    ${upload.dragOver ? styles["drag-over"] : ""} 
                    ${upload.hasFiles ? styles["has-files"] : ""}`}
        onDragOver={upload.onDragOver}
        onDragLeave={upload.onDragLeave}
        onDrop={upload.onDrop}
      >
        <input
          ref={upload.inputRef}
          className={`${styles.input}`}
          id={id}
          name={name}
          type="file"
          accept={accept?.join(",")}
          multiple={multiple}
          required={required}
          onChange={upload.onChange}
        />
        <UploadFileIcon className={styles.icon} />
        <div className={styles["label-container"]}>
          <h3 className={styles["help-text"]}>Drop the file here or </h3>
          <label htmlFor={id} className={`${styles.label}`}>
            <b className={`${styles["browse-text"]}`}>Browse</b>
          </label>
        </div>
        <p className={styles["accepted-files"]}>
          {upload.hasFiles ? upload.fileNames.join(", ") : acceptedFilesText()}
        </p>
      </div>
    </div>
  )
}
