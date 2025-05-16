export type PluginPlatforms = {
  linux: boolean
  windows: boolean
  macos: boolean
}

export type Plugin = {
  name: string
  version: string
  description: string
  repository: string
  icon_path: string
  author?: string
  author_email?: string
  platforms: PluginPlatforms
  module?: string
  location: string
  error?: string
  is_loaded?: boolean
}
