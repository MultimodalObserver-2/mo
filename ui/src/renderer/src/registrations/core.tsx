import Participants from "../modules/organization/components/participants/Participants"
import Projects from "../modules/organization/components/projects/Projects"
import Protocols from "../modules/organization/components/protocols/Protocols"
import ConfigsPanelWrapper from "@renderer/modules/organization/components/configurations-panel/ConfigsPanelWrapper"
import panelRegistry from "@renderer/core/store/panelRegistry"
import ControlsPanelElement from "@renderer/core/components/controls-panel-element/ControlsPanelElement"
import CaptureActions from "@renderer/modules/capture/components/capture-actions/CaptureActions"
import panelControlsRegistry from "@renderer/core/store/panelControlsRegistry"
import homePageRegistry from "@renderer/core/store/homePageRegistry"
import PreviewDock from "@renderer/modules/visualization/components/preview-dock-wrapper/PreviewDock"
import CaptureHeader from "@renderer/modules/capture/components/capture-header/CaptureHeader"
import OpenSessionsPlayback from "@renderer/modules/visualization/components/open-sessions-playback/OpenSessionsPlayback"
import ProtocolActions from "@renderer/modules/organization/components/protocol-actions/ProtocolActions"

/**
Panel items registration
These components will be rendered in the panel on the bottom of the core main layout
The order of registration determines the order in which they appear in the panel
The `id` property must be unique, and if an item with the same id is registered again, it will replace the previous one
The `order` property is optional, and if not provided, the item will be placed at the end of the panel
The `render` property is a function that returns the component to be rendered in the panel
*/

export function registerPanelItems() {
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
      id: "configurations",
      order: 3,
      render: ConfigsPanelWrapper
    },
    {
      id: "protocols",
      order: 4,
      render: Protocols
    },
    {
      id: "controls",
      order: 5,
      render: ControlsPanelElement
    }
  ])
}

export function registerPanelControlItems() {
  panelControlsRegistry.registerMany([
    {
      id: "capture-actions",
      order: 1,
      render: CaptureActions
    },
    {
      id: "protocol-actions",
      order: 2,
      render: ProtocolActions
    },
    {
      id: "open-sessions-playback",
      order: 3,
      render: OpenSessionsPlayback
    }
  ])
}

export function registerHomePage() {
  homePageRegistry.setBody({
    id: "playback-preview",
    render: PreviewDock
  })

  homePageRegistry.registerManyHeaders([
    {
      id: "capture-header",
      priority: 1,
      render: CaptureHeader
    }
  ])
}
