export type PluginPlatforms = {
  linux: boolean
  windows: boolean
  macos: boolean
}

export type PluginIcons = {
  dark: string
  light: string
}

export type Plugin = {
  name: string
  version: string
  description: string
  repository: string
  icon_path: string | PluginIcons
  author?: string
  author_email?: string
  platforms: PluginPlatforms
  module?: string
  location: string
  error?: string
  is_loaded?: boolean
}
