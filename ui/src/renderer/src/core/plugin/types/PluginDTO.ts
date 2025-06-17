export type PluginPlatforms = {
  linux: boolean
  windows: boolean
  macos: boolean
}

export type PluginIcons = {
  dark: string
  light: string
}

export type PluginAuthor = {
  name?: string
  email?: string
}

export type PluginPublisher = {
  name: string
  url?: string
}

export type PluginDTO = {
  id: string
  name: string
  description: string
  version: string
  publisher: PluginPublisher
  repository: string
  icon_path: string | PluginIcons
  author?: PluginAuthor
  platforms: PluginPlatforms
  target: "api" | "ui"
  location: string
  module?: string
  error?: string
  is_loaded?: boolean
}
