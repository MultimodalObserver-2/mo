import { registerSessionPlaybackAction } from "./capture"
import { registerPanelControlItems, registerPanelItems } from "./core"
import { registerConfigProviders } from "./organization"

export function registerAll() {
  registerPanelControlItems()
  registerPanelItems()
  registerConfigProviders()
  registerSessionPlaybackAction()
}
