import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { useParams } from "react-router"
import captureSettingsService from "../../services/CaptureSettingsService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"

export default function AddCaptureSettings() {
  const { projectName, pluginName } = useParams<{ projectName: string; pluginName: string }>()

  if (!projectName || !pluginName) {
    window.close()
    return
  }

  const addSource = async (name: string, settings: Record<string, unknown>) => {
    try {
      await captureSettingsService.addSettings(projectName, name, pluginName, settings)
      window.capture.reloadSettings()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  return (
    <ConfigurePlugin
      pluginName={pluginName}
      submitLabel="ADD SOURCE"
      onSubmit={addSource}
      onClose={closeModalWindow}
    />
  )
}
