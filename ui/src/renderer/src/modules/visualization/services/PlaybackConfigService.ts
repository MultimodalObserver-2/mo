import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import {
  PlaybackConfig,
  PlaybackConfigApi,
  PlaybackConfigCreate,
  PlaybackConfigUpdate
} from "../types/PlaybackConfig"
import uiPluginService from "@renderer/core/services/UiPluginService"
import { deepEqual } from "@renderer/core/utils/deepEqual"

class PlaybackConfigService {
  async create(
    projectName: string,
    data: PlaybackConfigCreate
  ): Promise<AxiosResponse<PlaybackConfigApi, unknown>> {
    uiPluginService.validateSettings(data.plugin_id, data.settings)
    return axios.post(`/projects/${projectName}/playback/configs`, data)
  }

  async getAll(projectName: string): Promise<PlaybackConfig[]> {
    const response = await axios.get(`/projects/${projectName}/playback/configs`)
    const configs: PlaybackConfigApi[] = response.data
    return Promise.all(
      configs.map(async (config) => {
        try {
          const plugin = await uiPluginService.get(config.plugin_id)
          return {
            id: config.id,
            name: config.name,
            plugin_id: config.plugin_id,
            plugin_icon: plugin.icon_path,
            plugin_is_loaded: plugin.is_loaded,
            capture_config_id: config.capture_config_id,
            settings: config.settings
          } as PlaybackConfig
        } catch {
          return {
            id: config.id,
            name: config.name,
            plugin_id: config.plugin_id,
            plugin_icon: undefined,
            plugin_is_loaded: false,
            capture_config_id: config.capture_config_id,
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
      id: config.id,
      name: config.name,
      plugin_id: config.plugin_id,
      plugin_icon: plugin.icon_path,
      plugin_is_loaded: plugin.is_loaded,
      capture_config_id: config.capture_config_id,
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

  async saveLayout(
    projectName: string,
    layout: Record<string, unknown>
  ): Promise<AxiosResponse<void, unknown>> {
    return axios.post(`/projects/${projectName}/playback/layout`, layout)
  }

  async getLayout(projectName: string): Promise<Record<string, unknown>> {
    const response = await axios.get(`/projects/${projectName}/playback/layout`)
    return response.data
  }

  isEqual(a: PlaybackConfig, b: PlaybackConfig): boolean {
    return (
      a.id === b.id &&
      a.name === b.name &&
      a.plugin_id === b.plugin_id &&
      a.plugin_is_loaded === b.plugin_is_loaded &&
      a.capture_config_id === b.capture_config_id &&
      deepEqual(a.plugin_icon, b.plugin_icon) &&
      deepEqual(a.settings, b.settings)
    )
  }
}

const playbackConfigService = new PlaybackConfigService()
export default playbackConfigService
