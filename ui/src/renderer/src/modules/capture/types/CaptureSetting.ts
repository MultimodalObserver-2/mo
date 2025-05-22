import { PluginIcons } from "@renderer/core/types/Plugin"

export type CaptureSetting = {
  name: string
  plugin_name: string
  plugin_icon: string | PluginIcons
  settings: Record<string, string | number | boolean>
}
