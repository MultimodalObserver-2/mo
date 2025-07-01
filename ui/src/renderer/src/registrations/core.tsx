/**
 * @fileoverview
 * Registration functions for core UI elements.
 *
 * This file defines and exports functions to statically register panel items,
 * panel controls, and home page elements into their respective registries.
 */

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
 * Registers main panel items to be displayed in the bottom panel of the core app layout.
 *
 * Each registered item must have:
 * - `id` (string): Unique identifier for the panel item. Used for replacement and ordering.
 * - `order` (number, optional): Determines the item's order in the panel. Lower values appear first. Items without order are placed at the end.
 * - `render` (function): Returns the ReactNode/component to render in the panel.
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

/**
 * Registers control panel items to be rendered in the panel controls area.
 *
 * Each control must provide:
 * - `id` (string): Unique identifier for the control. Used for replacement and ordering.
 * - `order` (number, optional): Determines the control's position. Lower values appear first.
 * - `render` (function): Returns the ReactNode/component to render as a control.
 */
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

/**
 * Registers the home page body and header components.
 *
 * Body:
 * - `id` (string): Unique identifier for the home page body.
 * - `render` (function): Returns the ReactNode/component for the body content.
 *
 * Headers:
 * - `id` (string): Unique identifier for the header.
 * - `priority` (number): Determines the order of headers; lower numbers are shown first.
 * - `render` (function): Returns the ReactNode/component for the header.
 */
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
