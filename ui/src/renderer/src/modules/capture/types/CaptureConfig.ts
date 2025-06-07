import { PluginIcons } from "@renderer/core/types/Plugin"

export type CaptureConfig = {
  name: string
  plugin_id: string
  plugin_icon?: string | PluginIcons
  plugin_is_loaded: boolean
  settings: Record<string, string | number | boolean>
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
