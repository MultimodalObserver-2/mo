import { registerPanelItems } from "./core"
import { registerConfigProviders } from "./organization"

const registrations = [
  registerPanelItems,
  registerConfigProviders
]

export default registrations
