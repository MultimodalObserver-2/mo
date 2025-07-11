import { useTranslation } from "react-i18next"
import UploadFileIcon from "../icons/UploadFileIcon"
import styles from "./file-upload.module.css"
import useUpload from "./useUpload"

export interface FileUploadProps {
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
  files,
  onChangeFiles
}: Readonly<FileUploadProps>): React.ReactElement {
  const { t } = useTranslation("core", { keyPrefix: "components.fileUpload" })
  const upload = useUpload(accept, multiple, files, onChangeFiles)

  const acceptedFilesText = () => {
    if (!accept || accept.length === 0) {
      return t("allFilesAccepted")
    }
    return t("acceptedFileTypes") + ": " + accept.join(", ")
  }

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={`${styles["upload-zone"]}
                    ${upload.dragOver ? styles["drag-over"] : ""} 
                    ${upload.hasFiles ? styles["has-files"] : ""}`}
        onDragOver={upload.onDragOver}
        onDragLeave={upload.onDragLeave}
        onDrop={upload.onDrop}
        aria-label={t("ariaLabel")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            upload.inputRef.current?.click()
          }
        }}
        tabIndex={0}
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
          <h3 className={styles["help-text"]}>{t("dropOr")}</h3>
          <label htmlFor={id} className={`${styles.label}`}>
            <b className={`${styles["browse-text"]}`}>{t("browse")}</b>
          </label>
        </div>
        <p className={styles["accepted-files"]}>
          {upload.hasFiles ? upload.fileNames.join(", ") : acceptedFilesText()}
        </p>
      </button>
    </div>
  )
}
