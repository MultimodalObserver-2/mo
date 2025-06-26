import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { Await, useParams } from "react-router"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { PlaybackConfigCreate } from "../../types/PlaybackConfig"
import playbackConfigService from "../../services/PlaybackConfigService"
import { Suspense } from "react"
import pluginService from "@renderer/core/services/PluginService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import Select from "@renderer/core/components/select/Select"
import playbackService from "../../services/PlaybackService"

export default function AddPlaybackConfig() {
  const { projectName, pluginId } = useParams<{ projectName: string; pluginId: string }>()

  if (!projectName || !pluginId) {
    window.close()
    return
  }

  const addPlaybackView = async (
    name: string,
    settings: Record<string, string | number | boolean>,
    extra: Record<string, string | number | boolean> = {}
  ) => {
    const config: PlaybackConfigCreate = {
      name: name,
      plugin_id: pluginId,
      capture_config_id: extra.capture_config_id as string,
      settings: settings
    }
    try {
      await playbackConfigService.create(projectName, config)
      window.visualization.reloadPlaybackConfigs()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  const getPluginValidCaptureConfigs = async () => {
    await pluginService.ui.loadAll()
    return playbackService.getPluginValidCaptureConfigs(projectName, pluginId)
  }

  const loadCaptureConfigsPromise = getPluginValidCaptureConfigs()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Await resolve={loadCaptureConfigsPromise} errorElement={<ErrorElement name="Playback" />}>
        {(captureConfigs) => (
          <ConfigurePlugin
            pluginId={pluginId}
            target="ui"
            submitLabel="ADD VIEW"
            onSubmit={addPlaybackView}
            onClose={closeModalWindow}
          >
            <Select
              label="Capture Config"
              placeholder="Select a capture config"
              name="capture_config_id"
            >
              {captureConfigs.map((config) => (
                <option key={config.id} value={config.id}>
                  {config.name}
                </option>
              ))}
            </Select>
          </ConfigurePlugin>
        )}
      </Await>
    </Suspense>
  )
}
