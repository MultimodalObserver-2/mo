import { useState } from "react"
import styles from "./plugins.module.css"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import FileUpload from "@renderer/core/components/file-upload/FileUpload"
import NoteStackAddIcon from "@renderer/core/components/icons/NoteStackAddIcon"
import Button from "@renderer/core/components/button/Button"
import pluginService from "@renderer/core/services/PluginService"

export default function Register() {
  const [files, setFiles] = useState<File[]>([])
  const [isRegistering, setIsRegistering] = useState(false)

  const handleSubmitPlugin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const fileInput = formData.get("plugins") as File
    setIsRegistering(true)
    try {
      const plugin = await pluginService.register(fileInput)
      if (plugin.is_loaded) {
        window.core.dialog.showMessageBox({
          type: "info",
          title: "Plugin Registration",
          message: "Plugin registered successfully"
        })
      } else {
        window.core.dialog.showMessageBox({
          type: "warning",
          title: "Plugin Registration",
          message: `The plugin was registered but failed to load correctly: \n${plugin.error}`
        })
      }
    } catch (error) {
      console.error("Error registering plugin:", error)
      showApiErrorMessage(error)
    }

    setIsRegistering(false)
    setFiles([])
  }
  return (
    <form className={styles["upload-container"]} onSubmit={handleSubmitPlugin}>
      <FileUpload id="plugins" name="plugins" accept={[".zip"]} files={files} required />
      <Button
        styleType="default"
        borderRadius="md"
        type="submit"
        className={styles.button}
        isLoading={isRegistering}
      >
        <NoteStackAddIcon className={styles.icon} />
        Register plugin
      </Button>
    </form>
  )
}
