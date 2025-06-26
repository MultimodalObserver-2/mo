import pluginManager from "@renderer/core/plugin/PluginManager"
import { Plugin } from "@renderer/core/types/Plugin"
import { PlaybackPlugin } from "../plugin/PlaybackPlugin"
import captureConfigService from "@renderer/modules/capture/services/CaptureConfigService"
import { CaptureConfig } from "@renderer/modules/capture/types/CaptureConfig"

class PlaybackService {
  async getPlugins(): Promise<Plugin[]> {
    const plugins = await pluginManager.getPluginsMetadataByType(
      PlaybackPlugin as unknown as new (...args: unknown[]) => PlaybackPlugin
    )

    return plugins as Plugin[]
  }

  getPluginInstanceById(pluginId: string) {
    return pluginManager.getPluginInstanceByIdAndType(
      pluginId,
      PlaybackPlugin as unknown as new (...args: unknown[]) => PlaybackPlugin
    )
  }

  getPluginValidExtensions(pluginId: string): string[] {
    const plugin = this.getPluginInstanceById(pluginId)
    if (plugin) {
      return plugin.validExtensions()
    }
    return []
  }

  async getPluginValidCaptureConfigs(
    projectName: string,
    pluginId: string
  ): Promise<CaptureConfig[]> {
    const validExtensions = this.getPluginValidExtensions(pluginId)
    const captureConfigsRes = await captureConfigService.getAll(projectName)
    const captureConfigs = captureConfigsRes.data
    const validCaptureConfigs = captureConfigs.filter((config) =>
      validExtensions.includes(config.file_extension)
    )
    return validCaptureConfigs
  }
}

const playbackService = new PlaybackService()

export default playbackService
