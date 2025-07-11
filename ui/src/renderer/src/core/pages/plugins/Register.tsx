import { useTranslation } from "react-i18next"
import styles from "./plugins.module.css"
import { useState } from "react"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import FileUpload from "@renderer/core/components/file-upload/FileUpload"
import NoteStackAddIcon from "@renderer/core/components/icons/NoteStackAddIcon"
import Button from "@renderer/core/components/button/Button"
import pluginService from "@renderer/core/services/PluginService"

export default function Register() {
  const { t } = useTranslation("core", { keyPrefix: "components.registerPlugin" })
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
          title: t("pluginRegistration"),
          message: t("registeredSuccessfully")
        })
      } else {
        window.core.dialog.showMessageBox({
          type: "warning",
          title: t("pluginRegistration"),
          message: t("registeredButFailed", { error: plugin.error })
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
      <Button className={styles.button} borderRadius="md" type="submit" isLoading={isRegistering}>
        <NoteStackAddIcon className={styles.icon} />
        {t("registerPlugin")}
      </Button>
    </form>
  )
}
