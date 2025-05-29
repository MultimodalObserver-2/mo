import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { Await, useParams } from "react-router"
import captureSettingsService from "../../services/CaptureSettingsService"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { CaptureSettingUpdate } from "../../types/CaptureSetting"
import { Suspense } from "react"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"

export default function UpdateCaptureSettings() {
  const { projectName, settingsName } = useParams<{ projectName: string; settingsName: string }>()

  if (!projectName || !settingsName) {
    window.close()
    return
  }

  const addSource = async (name: string, settings: Record<string, string | number | boolean>) => {
    const settingsData: CaptureSettingUpdate = {
      name: name,
      settings: settings
    }
    try {
      await captureSettingsService.update(projectName, settingsName, settingsData)
      window.capture.reloadSettings()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  const fetchCaptureSettings = async () => {
    const response = await captureSettingsService.get(projectName, settingsName)
    return response.data
  }

  const captureSettingsPromise = fetchCaptureSettings()

  return (
    <Suspense>
      <Await
        resolve={captureSettingsPromise}
        errorElement={<ErrorElement name="Capture Settings" />}
      >
        {(captureSettings) => {
          return (
            <ConfigurePlugin
              pluginId={captureSettings.plugin_id}
              submitLabel="UPDATE SOURCE"
              onSubmit={addSource}
              onClose={closeModalWindow}
              initialConfigName={captureSettings.name}
              initialSettings={captureSettings.settings}
            />
          )
        }}
      </Await>
    </Suspense>
  )
}
