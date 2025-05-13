import FileUpload from "@renderer/core/components/file-upload/FileUpload"
import styles from "./plugins.module.css"
import Button from "@renderer/core/components/button/Button"
import NoteStackAddIcon from "@renderer/core/components/icons/NoteStackAddIcon"
import pluginService from "@renderer/core/services/PluginService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { useRef, useState } from "react"

export default function PluginsPage() {
  const formRef = useRef<HTMLFormElement>(null)
  const [files, setFiles] = useState<File[]>([])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    formRef.current?.reset()
  }

  return (
    <main className={styles.main}>
      <form ref={formRef} className={styles["upload-container"]} onSubmit={handleSubmit}>
        <FileUpload id="plugins" name="plugins" accept={[".zip"]} files={files} required />
        <Button styleType="default" borderRadius="md" type="submit" className={styles.button}>
          <NoteStackAddIcon className={styles.icon} />
          Register plugin
        </Button>
      </form>
    </main>
  )
}
