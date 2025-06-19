import { PluginIcons } from "@renderer/core/types/Plugin"

export type PlaybackConfigApi = {
  name: string
  plugin_id: string
  settings: Record<string, string | number | boolean>
}

export type PlaybackConfig = {
  name: string
  plugin_id: string
  plugin_icon?: string | PluginIcons
  plugin_is_loaded: boolean
  settings: Record<string, string | number | boolean>
}

export type PlaybackConfigCreate = {
  name: string
  plugin_id: string
  settings: Record<string, string | number | boolean>
}

export type PlaybackConfigUpdate = {
  name: string
  settings: Record<string, string | number | boolean>
}
