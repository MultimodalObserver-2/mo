/**
 * @module modules/organization/store/configProviderRegistry
 * @description
 * Provides a registry for managing configuration providers used in the configurations panel.
 * Each registered provider describes how to interact with a specific type of configuration
 * (fetch, add, delete, open, reload) and how it is represented in the UI.
 *
 * Registered providers are shown in a select list in the configurations panel,
 * allowing the user to operate on different configuration types.
 * Providers are ordered and uniquely identified by `id`.
 */

import { ConfigProvider } from "../components/configurations-panel/ConfigurationsPanel"

/**
 * Describes the state for a registered configuration provider.
 *
 * @property id - Unique identifier for the provider (used for selection and ordering).
 * @property order - (Optional) Determines display order; lower numbers appear first.
 * @property configProvider - The configuration provider implementation, including UI label and handlers.
 */
export interface ConfigProviderState {
  id: string
  order?: number
  configProvider: ConfigProvider
}

/**
 * Manages registration and retrieval of configuration providers for the organization module.
 * Providers control how different types of configurations are listed and managed in the UI.
 */
class ConfigProviderRegistry {
  private providers: ConfigProviderState[] = []

  /**
   * Registers a single configuration provider.
   * If another provider with the same `id` exists, it is replaced.
   * @param provider - The provider to register.
   */
  register(provider: ConfigProviderState): void {
    const filtered = this.providers.filter((p) => p.id !== provider.id)
    this.providers = [...filtered, provider].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  /**
   * Unregisters a configuration provider by its unique `id`.
   * @param id - The id of the provider to remove.
   */
  unregister(id: string): void {
    this.providers = this.providers.filter((p) => p.id !== id)
  }

  /**
   * Registers multiple configuration providers at once.
   * Each replaces any existing provider with the same `id`.
   * @param newProviders - The providers to register.
   */
  registerMany(newProviders: ConfigProviderState[]): void {
    newProviders.forEach((provider) => {
      const filtered = this.providers.filter((p) => p.id !== provider.id)
      this.providers = [...filtered, provider].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
  }

  /**
   * Returns all registered provider states, sorted by order.
   * @returns Array of registered ConfigProviderState objects.
   */
  getProviders(): ConfigProviderState[] {
    return this.providers
  }

  /**
   * Returns the list of registered ConfigProvider implementations only (for use in the panel select).
   * @returns Array of ConfigProvider objects.
   */
  getConfigProviders(): ConfigProvider[] {
    return this.providers.map((p) => p.configProvider)
  }
}

const configProviderRegistry = new ConfigProviderRegistry()
export default configProviderRegistry
