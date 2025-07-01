/**
 * @fileoverview
 * Static registration functions for the organization module.
 *
 * This file is responsible for registering all extensible elements and providers
 * related to the organization domain, such as configuration providers.
 */

import captureConfigProvider from "@renderer/modules/capture/components/capture-sources/captureSourceConfigs"
import configProviderRegistry from "@renderer/modules/organization/store/configProviderRegistry"
import playbackConfigProvider from "@renderer/modules/visualization/components/playback-views-configs/playbackViewsConfigs"

/**
 * Registers configuration providers for the organization module.
 *
 * Each configuration provider enables support for a different type of configuration
 * in the configurations panel. Providers are registered with the following properties:
 * - `id` (string): Unique identifier for the configuration provider type.
 * - `order` (number, optional): Determines the display order in the select list. Lower values appear first.
 * - `configProvider` (ConfigProvider): The implementation for fetching, displaying, and managing this configuration type.
 *
 * The providers will appear as selectable options in the configurations panel UI,
 * allowing users to add, delete, or update configurations for each registered type.
 */
export function registerConfigProviders() {
  configProviderRegistry.registerMany([
    {
      id: "capture-sources",
      order: 1,
      configProvider: captureConfigProvider
    },
    {
      id: "playback-views",
      order: 2,
      configProvider: playbackConfigProvider
    }
  ])
}
