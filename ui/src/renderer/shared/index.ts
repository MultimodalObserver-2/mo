/**
 * @fileoverview
 * Central export hub for the plugin developer API.
 *
 * This file exposes all classes, types, and utilities that are officially supported
 * for use by external plugins via the "mo" import map. Only items exported here will
 * be accessible to plugin developers.
 *
 * When extending or modifying the plugin API, update this file accordingly to ensure
 * new features, types, or base classes are properly exposed.
 */

// Core plugin base types and API for all plugins
export { PluginBase } from "@renderer/core/plugin/types/PluginBase"
export type { PluginMetadata } from "@renderer/core/plugin/types/PluginMetadata"
export { Properties, Property } from "@renderer/core/plugin/types/Properties"
export type {
  PropertyType,
  PropertySelectOption,
  ModifiedCallback
} from "@renderer/core/plugin/types/Properties"

// Visualization/Playback plugin extensions
export { PlaybackPlugin } from "@renderer/modules/visualization/plugin/PlaybackPlugin"

// i18n for internationalization
export { i18n } from "@renderer/utils/i18n"
export { useTranslation, Trans } from "react-i18next"
