import { useState } from "react"
import styles from "./plugins.module.css"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import pluginService from "@renderer/core/services/PluginService"
import FileUpload from "@renderer/core/components/file-upload/FileUpload"
import NoteStackAddIcon from "@renderer/core/components/icons/NoteStackAddIcon"
import Button from "@renderer/core/components/button/Button"

export default function Register() {
  const [files, setFiles] = useState<File[]>([])

  const handleSubmitPlugin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const fileInput = formData.get("plugins") as File
    try {
      await pluginService.register(fileInput)
      window.core.dialog.showMessageBox({
        type: "info",
        title: "Plugin Registration",
        message: "Plugin registered successfully"
      })
    } catch (error) {
      showApiErrorMessage(error)
    }

    setFiles([])
  }
  return (
    <form className={styles["upload-container"]} onSubmit={handleSubmitPlugin}>
      <FileUpload id="plugins" name="plugins" accept={[".zip"]} files={files} required />
      <Button styleType="default" borderRadius="md" type="submit" className={styles.button}>
        <NoteStackAddIcon className={styles.icon} />
        Register plugin
      </Button>
    </form>
  )
}
