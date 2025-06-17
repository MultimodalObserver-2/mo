export interface PluginMetadata {
  id: string
  name: string
  description: string
  version: string
  publisher: { id: string; name: string; url?: string }
  repository?: string
  author?: { name?: string; email?: string }
  icon?:
    | {
        light?: string
        dark?: string
      }
    | string
  platform?: { linux?: boolean; windows?: boolean; macos?: boolean }
  entryPoints: {
    "mo.ui.plugin.renderer"?: string
    [key: string]: string | undefined
  }
  target: "api" | "ui"
}
