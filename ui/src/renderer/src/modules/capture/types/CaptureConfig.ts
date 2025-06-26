import { PluginIcons } from "@renderer/core/types/Plugin"

export type CaptureConfig = {
  id: string
  name: string
  plugin_id: string
  plugin_icon?: string | PluginIcons
  plugin_is_loaded: boolean
  settings: Record<string, string | number | boolean>
  file_extension: string
}

export type CaptureConfigCreate = {
  name: string
  plugin_id: string
  settings: Record<string, string | number | boolean>
}

export type CaptureConfigUpdate = {
  name: string
  settings: Record<string, string | number | boolean>
}
