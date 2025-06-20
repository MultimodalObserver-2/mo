import Sessions from "@renderer/modules/capture/components/sessions/Sessions"
import Participants from "../modules/organization/components/participants/Participants"
import Projects from "../modules/organization/components/projects/Projects"
import Protocols from "../modules/organization/components/protocols/Protocols"
import ConfigsPanelWrapper from "@renderer/modules/organization/components/configurations-panel/ConfigsPanelWrapper"
import panelRegistry from "@renderer/core/store/panelRegistry"

/**
Panel items registration
These components will be rendered in the panel on the bottom of the core main layout
The order of registration determines the order in which they appear in the panel
The `id` property must be unique, and if an item with the same id is registered again, it will replace the previous one
The `order` property is optional, and if not provided, the item will be placed at the end of the panel
The `render` property is a function that returns the component to be rendered in the panel
*/

panelRegistry.registerMany([
  {
    id: "projects",
    order: 1,
    render: Projects
  },
  {
    id: "participants",
    order: 2,
    render: Participants
  },
  {
    id: "sessions",
    order: 3,
    render: Sessions
  },
  {
    id: "configurations",
    order: 4,
    render: ConfigsPanelWrapper
  },
  {
    id: "protocols",
    order: 5,
    render: Protocols
  }
])
