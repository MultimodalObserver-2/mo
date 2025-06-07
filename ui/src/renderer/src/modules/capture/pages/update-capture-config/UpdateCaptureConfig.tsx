import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { Await, useParams } from "react-router"
import captureConfigService from "../../services/CaptureConfigService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { CaptureConfigUpdate } from "../../types/CaptureConfig"
import { Suspense } from "react"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"

export default function UpdateCaptureConfig() {
  const { projectName, configName } = useParams<{ projectName: string; configName: string }>()

  if (!projectName || !configName) {
    window.close()
    return
  }

  const addSource = async (name: string, settings: Record<string, string | number | boolean>) => {
    const config: CaptureConfigUpdate = {
      name: name,
      settings: settings
    }
    try {
      await captureConfigService.update(projectName, configName, config)
      window.capture.reloadConfigs()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  const fetchCaptureConfig = async () => {
    const response = await captureConfigService.get(projectName, configName)
    return response.data
  }

  const captureConfigPromise = fetchCaptureConfig()

  return (
    <Suspense>
      <Await resolve={captureConfigPromise} errorElement={<ErrorElement name="Capture Config" />}>
        {(captureConfig) => {
          return (
            <ConfigurePlugin
              pluginId={captureConfig.plugin_id}
              submitLabel="UPDATE SOURCE"
              onSubmit={addSource}
              onClose={closeModalWindow}
              initialConfigName={captureConfig.name}
              initialSettings={captureConfig.settings}
            />
          )
        }}
      </Await>
    </Suspense>
  )
}
