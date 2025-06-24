import { PluginMetadata } from "./PluginMetadata"

export abstract class PluginBase {
  static readonly __module: string = "core"
  abstract readonly metadata: PluginMetadata
  settings: Record<string, unknown> = {}

  configure(settings: Record<string, unknown>): void {
    this.settings = settings
    this.onConfigure(settings)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onConfigure(settings: Record<string, unknown>): void {
    // No default implementation
  }
}
