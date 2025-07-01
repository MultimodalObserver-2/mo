/**
 * @module core/store/panelRegistry
 * @description
 * Provides a registry for managing panel items in the core layout of the app.
 * Other modules can use this registry to register, unregister.
 *
 * Items are ordered and uniquely identified by `id`. If an item with the same
 * `id` is registered again, it will replace the previous entry.
 */

import { ReactNode } from "react"

/**
 * Represents a UI element that can be registered to the panel.
 * 
 * @property id - Unique identifier for the panel item.
 * @property order - (Optional) Determines the order in which the item appears in the panel. Lower values come first.
 * @property render - Function that returns a ReactNode to be rendered.
 */
export interface PanelItem {
  id: string
  order?: number
  render: () => ReactNode
}

/**
 * Manages the registration and retrieval of panel items.
 * Items are always sorted by their `order` property.
 */
class PanelRegistry {
  private items: PanelItem[] = []

  /**
   * Registers a single panel item. Replaces any item with the same `id`.
   * @param item - The panel item to register.
   */
  register(item: PanelItem): void {
    const filtered = this.items.filter((i) => i.id !== item.id)
    this.items = [...filtered, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  /**
   * Removes a panel item by its unique `id`.
   * @param id - The id of the item to remove.
   */
  unregister(id: string): void {
    this.items = this.items.filter((item) => item.id !== id)
  }

  /**
   * Registers multiple panel items at once. Each will replace any existing item with the same `id`.
   * @param items - The panel items to register.
   */
  registerMany(items: PanelItem[]): void {
    items.forEach((item) => {
      const filtered = this.items.filter((existing) => existing.id !== item.id)
      this.items = [...filtered, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
  }

  /**
   * Returns all currently registered panel items, sorted by order.
   * @returns Array of registered PanelItem objects.
   */
  getItems(): PanelItem[] {
    return this.items
  }
}

const panelRegistry = new PanelRegistry()
export default panelRegistry
