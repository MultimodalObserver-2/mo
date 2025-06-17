import { PluginMetadata } from "./PluginMetadata"

export abstract class PluginBase {
  static readonly __module: string = "core"
  abstract readonly metadata: PluginMetadata
}
