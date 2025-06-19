import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { Await, useParams } from "react-router"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { PlaybackConfigUpdate } from "../../types/PlaybackConfig"
import playbackConfigService from "../../services/PlaybackConfigService"
import { Suspense } from "react"
import pluginService from "@renderer/core/services/PluginService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"

export default function UpdatePlaybackConfig() {
  const { projectName, configName } = useParams<{ projectName: string; configName: string }>()

  if (!projectName || !configName) {
    window.close()
    return
  }

  const addPlaybackView = async (
    name: string,
    pluginId: string,
    settings: Record<string, string | number | boolean>
  ) => {
    const config: PlaybackConfigUpdate = {
      name: name,
      settings: settings
    }
    try {
      await playbackConfigService.update(projectName, pluginId, configName, config)
      window.visualization.reloadPlaybackConfigs()
      window.close()
    } catch (error) {
      showApiErrorMessage(error)
    }
  }

  const closeModalWindow = () => {
    window.close()
  }

  const fetchPlaybackConfig = async () => {
    await pluginService.ui.loadAll()
    const response = await playbackConfigService.get(projectName, configName)
    return response
  }

  const playbackConfigPromise = fetchPlaybackConfig()

  return (
    <Suspense
      fallback={
        <div
          style={{
            backgroundColor: "var(--color-primary-700)",
            color: "var(--color-text-light)",
            width: "100%",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        ></div>
      }
    >
      <Await resolve={playbackConfigPromise} errorElement={<ErrorElement name="Playback Config" />}>
        {(playbackConfig) => {
          return (
            <ConfigurePlugin
              pluginId={playbackConfig.plugin_id}
              target="ui"
              submitLabel="UPDATE VIEW"
              onSubmit={(name, settings) =>
                addPlaybackView(name, playbackConfig.plugin_id, settings)
              }
              onClose={closeModalWindow}
              initialConfigName={playbackConfig.name}
              initialSettings={playbackConfig.settings}
            />
          )
        }}
      </Await>
    </Suspense>
  )
}
