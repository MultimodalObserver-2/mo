import ConfigurePlugin from "@renderer/core/components/configure-plugin/ConfigurePlugin"
import { Await, useParams } from "react-router"
import { showApiErrorMessage } from "@renderer/core/utils/dialogMessages"
import { PlaybackConfigCreate } from "../../types/PlaybackConfig"
import playbackConfigService from "../../services/PlaybackConfigService"
import { Suspense } from "react"
import pluginService from "@renderer/core/services/PluginService"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"

export default function AddPlaybackConfig() {
  const { projectName, pluginId } = useParams<{ projectName: string; pluginId: string }>()

  if (!projectName || !pluginId) {
    window.close()
    return
  }

  const addPlaybackView = async (
    name: string,
    settings: Record<string, string | number | boolean>
  ) => {
    const config: PlaybackConfigCreate = {
      name: name,
      plugin_id: pluginId,
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

  const loadPluginsPromise = pluginService.ui.loadAll()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Await resolve={loadPluginsPromise} errorElement={<ErrorElement name="Playback" />}>
        <ConfigurePlugin
          pluginId={pluginId}
          target="ui"
          submitLabel="ADD VIEW"
          onSubmit={addPlaybackView}
          onClose={closeModalWindow}
        />
      </Await>
    </Suspense>
  )
}
