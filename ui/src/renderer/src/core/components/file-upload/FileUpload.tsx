import UploadFileIcon from "../icons/UploadFileIcon"
import styles from "./file-upload.module.css"
import useUpload from "./useUpload"

interface FileUploadProps {
  id?: string
  name?: string
  accept?: string[]
  multiple?: boolean
  required?: boolean
  files?: File[]
  onChangeFiles?: (files: File[]) => void
}

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
