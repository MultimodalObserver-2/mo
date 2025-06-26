import { registerSessionPlaybackAction } from "./capture"
import { registerHomePage, registerPanelControlItems, registerPanelItems } from "./core"
import { registerConfigProviders } from "./organization"

export function registerAll() {
  registerHomePage()
  registerPanelControlItems()
  registerPanelItems()
  registerConfigProviders()
  registerSessionPlaybackAction()
}
