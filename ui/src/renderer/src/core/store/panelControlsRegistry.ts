/**
 * @module core/store/panelControlsRegistry
 * @description
 * Provides a registry for managing control components within the main panel.
 * Modules can use this registry to register or unregister panel control elements
 * to be rendered in the bottom panel of the AppLayout.
 *
 * Controls are ordered and uniquely identified by `id`. If a control with the same
 * `id` is registered again, it will replace the previous entry.
 */

import { ReactNode } from "react"

/**
 * Represents a control element that can be registered to the panel controls area.
 *
 * @property id - Unique identifier for the control.
 * @property order - (Optional) Determines the order in which the control appears. Lower values come first.
 * @property render - Function that returns a ReactNode to be rendered.
 */
export interface PanelControl {
  id: string
  order?: number
  render: () => ReactNode
}

/**
 * Manages the registration and retrieval of panel control components.
 * Controls are always sorted by their `order` property.
 */
class PanelControlsRegistry {
  private controls: PanelControl[] = []

  /**
   * Registers a single control. Replaces any control with the same `id`.
   * @param control - The panel control to register.
   */
  register(control: PanelControl): void {
    const filtered = this.controls.filter((c) => c.id !== control.id)
    this.controls = [...filtered, control].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  /**
   * Removes a control by its unique `id`.
   * @param id - The id of the control to remove.
   */
  unregister(id: string): void {
    this.controls = this.controls.filter((control) => control.id !== id)
  }

  /**
   * Registers multiple controls at once. Each replaces any existing control with the same `id`.
   * @param controls - The panel controls to register.
   */
  registerMany(controls: PanelControl[]): void {
    controls.forEach((control) => {
      const filtered = this.controls.filter((existing) => existing.id !== control.id)
      this.controls = [...filtered, control].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
  }

  /**
   * Returns all currently registered controls, sorted by order.
   * @returns Array of registered PanelControl objects.
   */
  getControls(): PanelControl[] {
    return this.controls
  }

  /**
   * Clears all registered controls.
   */
  clearAll(): void {
    this.controls = []
  }
}

const panelControlsRegistry = new PanelControlsRegistry()
export default panelControlsRegistry
