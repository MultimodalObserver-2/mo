import pluginManager from "@renderer/core/plugin/PluginManager"
import { Plugin } from "@renderer/core/types/Plugin"
import { PlaybackPlugin } from "../plugin/PlaybackPlugin"

class PlaybackService {
  getPlugins(): Plugin[] {
    const plugins = pluginManager.getPluginsMetadataByType(
      PlaybackPlugin as unknown as new (...args: unknown[]) => PlaybackPlugin
    )

    return plugins as Plugin[]
  }
}

const playbackService = new PlaybackService()

export default playbackService
