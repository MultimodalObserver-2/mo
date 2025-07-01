/**
 * @module core/store/homePageRegistry
 * @description
 * Provides a registry for managing home page components, including
 * a single body element and multiple header elements.
 * Other modules can register header and body components
 * to customize the main home page layout of the application.
 *
 * Header items are prioritized and uniquely identified by `id`.
 * The body is a single component, replaceable by subsequent registrations.
 */

import { ReactNode } from "react"

/**
 * Represents a header element that can be displayed on the home page.
 *
 * @property id - Unique identifier for the header item.
 * @property priority - Determines the order of header elements. Lower values appear first.
 * @property render - Function that returns a ReactNode to be rendered.
 */
export interface HomePageHeader {
  id: string
  priority: number
  render: () => ReactNode
}

/**
 * Represents the main body element for the home page.
 *
 * @property id - Unique identifier for the body element.
 * @property render - Function that returns a ReactNode to be rendered.
 */
export interface HomePageBody {
  id: string
  render: () => ReactNode
}

/**
 * Manages the registration and retrieval of home page header and body components.
 */
class HomePageRegistry {
  private body: HomePageBody | null = null
  private headerItems: HomePageHeader[] = []

  /**
   * Registers or replaces the body component for the home page.
   * @param item - The body component to register.
   */
  setBody(item: HomePageBody): void {
    this.body = item
  }

  /**
   * Returns the currently registered home page body, or null if none is set.
   */
  getBody(): HomePageBody | null {
    return this.body
  }

  /**
   * Registers a single header component. Replaces any header with the same `id`.
   * @param item - The header component to register.
   */
  registerHeader(item: HomePageHeader): void {
    const filtered = this.headerItems.filter((i) => i.id !== item.id)
    this.headerItems = [...filtered, item].sort((a, b) => a.priority - b.priority)
  }

  /**
   * Registers multiple header components at once. Each replaces any header with the same `id`.
   * @param items - The header components to register.
   */
  registerManyHeaders(items: HomePageHeader[]): void {
    items.forEach((item) => {
      const filtered = this.headerItems.filter((existing) => existing.id !== item.id)
      this.headerItems = [...filtered, item].sort((a, b) => a.priority - b.priority)
    })
  }

  /**
   * Removes a header component by its unique `id`.
   * @param id - The id of the header to remove.
   */
  unregisterHeader(id: string): void {
    this.headerItems = this.headerItems.filter((item) => item.id !== id)
  }

  /**
   * Returns all registered header components, sorted by priority.
   * @returns Array of registered HomePageHeader objects.
   */
  getHeaders(): HomePageHeader[] {
    return this.headerItems
  }
}

const homePageRegistry = new HomePageRegistry()
export default homePageRegistry
