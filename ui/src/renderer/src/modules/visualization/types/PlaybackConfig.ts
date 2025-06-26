import { PluginIcons } from "@renderer/core/types/Plugin"

export type PlaybackConfigApi = {
  id: string
  name: string
  plugin_id: string
  capture_config_id: string
  settings: Record<string, string | number | boolean>
}

export type PlaybackConfig = {
  id: string
  name: string
  plugin_id: string
  plugin_icon?: string | PluginIcons
  plugin_is_loaded: boolean
  capture_config_id: string
  settings: Record<string, string | number | boolean>
}

export type PlaybackConfigCreate = {
  name: string
  plugin_id: string
  capture_config_id: string
  settings: Record<string, string | number | boolean>
}

export type PlaybackConfigUpdate = {
  name: string
  capture_config_id: string
  settings: Record<string, string | number | boolean>
}
