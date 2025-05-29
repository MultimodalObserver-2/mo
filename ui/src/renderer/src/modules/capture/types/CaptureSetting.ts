import { PluginIcons } from "@renderer/core/types/Plugin"

export type CaptureSetting = {
  name: string
  plugin_id: string
  plugin_icon?: string | PluginIcons
  plugin_is_loaded: boolean
  settings: Record<string, string | number | boolean>
}

export type CaptureSettingCreate = {
  name: string
  plugin_id: string
  settings: Record<string, string | number | boolean>
}

export type CaptureSettingUpdate = {
  name: string
  settings: Record<string, string | number | boolean>
}
