import { PluginIcons } from "@renderer/core/types/Plugin"

export type CaptureSetting = {
  name: string
  plugin_name: string
  plugin_icon: string | PluginIcons
  settings: Record<string, string | number | boolean>
}

export type CaptureSettingCreate = {
  name: string
  plugin_name: string
  settings: Record<string, string | number | boolean>
}

export type CaptureSettingUpdate = {
  name: string
  settings: Record<string, string | number | boolean>
}
