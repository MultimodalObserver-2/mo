import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { useParams } from "react-router"
import captureSettingsService from "../../services/CaptureSettingsService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { CaptureSettingCreate } from "../../types/CaptureSetting"

export default function AddCaptureSettings() {
  const { projectName, pluginId } = useParams<{ projectName: string; pluginId: string }>()

  if (!projectName || !pluginId) {
    window.close()
    return
  }

  const addSource = async (name: string, settings: Record<string, string | number | boolean>) => {
    const settingsData: CaptureSettingCreate = {
      name: name,
      plugin_id: pluginId,
      settings: settings
    }
    try {
      await captureSettingsService.create(projectName, settingsData)
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
      pluginId={pluginId}
      submitLabel="ADD SOURCE"
      onSubmit={addSource}
      onClose={closeModalWindow}
    />
  )
}
