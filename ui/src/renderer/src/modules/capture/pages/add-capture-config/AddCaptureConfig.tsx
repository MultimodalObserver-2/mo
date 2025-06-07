import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { useParams } from "react-router"
import captureConfigService from "../../services/CaptureConfigService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { CaptureConfigCreate } from "../../types/CaptureConfig"

export default function AddCaptureConfig() {
  const { projectName, pluginId } = useParams<{ projectName: string; pluginId: string }>()

  if (!projectName || !pluginId) {
    window.close()
    return
  }

  const addSource = async (name: string, settings: Record<string, string | number | boolean>) => {
    const config: CaptureConfigCreate = {
      name: name,
      plugin_id: pluginId,
      settings: settings
    }
    try {
      await captureConfigService.create(projectName, config)
      window.capture.reloadConfigs()
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
