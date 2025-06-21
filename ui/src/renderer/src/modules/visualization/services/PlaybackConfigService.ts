import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import {
  PlaybackConfig,
  PlaybackConfigApi,
  PlaybackConfigCreate,
  PlaybackConfigUpdate
} from "../types/PlaybackConfig"
import uiPluginService from "@renderer/core/services/UiPluginService"

class PlaybackConfigService {
  async create(
    projectName: string,
    data: PlaybackConfigCreate
  ): Promise<AxiosResponse<PlaybackConfigApi, unknown>> {
    uiPluginService.validateSettings(data.plugin_id, data.settings)
    return axios.post(`/projects/${projectName}/playback/configs/`, data)
  }

  async getAll(projectName: string): Promise<PlaybackConfig[]> {
    const response = await axios.get(`/projects/${projectName}/playback/configs/`)
    const configs: PlaybackConfigApi[] = response.data
    return Promise.all(
      configs.map(async (config) => {
        try {
          const plugin = await uiPluginService.get(config.plugin_id)
          return {
            name: config.name,
            plugin_id: config.plugin_id,
            plugin_icon: plugin.icon_path,
            plugin_is_loaded: plugin.is_loaded,
            settings: config.settings
          } as PlaybackConfig
        } catch {
          return {
            name: config.name,
            plugin_id: config.plugin_id,
            plugin_icon: undefined,
            plugin_is_loaded: false,
            settings: config.settings
          } as PlaybackConfig
        }
      })
    )
  }

  async get(projectName: string, configName: string): Promise<PlaybackConfig> {
    const response = await axios.get(`/projects/${projectName}/playback/configs/${configName}`)
    const config: PlaybackConfigApi = response.data
    const plugin = await uiPluginService.get(config.plugin_id)
    if (!plugin || !plugin.is_loaded) {
      throw new Error(`Plugin with ID ${config.plugin_id} is not loaded or does not exist.`)
    }

    return {
      name: config.name,
      plugin_id: config.plugin_id,
      plugin_icon: plugin.icon_path,
      plugin_is_loaded: plugin.is_loaded,
      settings: config.settings
    } as PlaybackConfig
  }

  async update(
    projectName: string,
    pluginId: string,
    configName: string,
    config: PlaybackConfigUpdate
  ): Promise<AxiosResponse<PlaybackConfigApi, unknown>> {
    uiPluginService.validateSettings(pluginId, config.settings)
    return axios.put(`/projects/${projectName}/playback/configs/${configName}`, config)
  }

  async delete(
    projectName: string,
    configName: string
  ): Promise<AxiosResponse<PlaybackConfigApi, unknown>> {
    return axios.delete(`/projects/${projectName}/playback/configs/${configName}`)
  }
}

const playbackConfigService = new PlaybackConfigService()
export default playbackConfigService
