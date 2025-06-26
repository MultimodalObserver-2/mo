import { registerSessionPlaybackAction } from "./capture"
import { registerPanelItems } from "./core"
import { registerConfigProviders } from "./organization"

export function registerAll() {
  registerPanelItems()
  registerConfigProviders()
  registerSessionPlaybackAction()
}
