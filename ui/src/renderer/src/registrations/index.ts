/**
 * @fileoverview
 * Centralized entry point for executing static registration functions
 * across all application modules. This pattern allows modules and the core
 * to register their components, providers, and extensible elements (such as
 * panels or controls) into global registries at app startup.
 *
 * Each file in the `registrations/` folder should export one or more functions
 * that perform registration logic for a specific module or concern.
 * All registration functions should be invoked here via `registerAll` to
 * ensure that every registry is populated before the app renders.
 *
 * This mechanism supports modular extensibility and decouples registration
 * from the core application initialization.
 */
import { registerHomePage, registerPanelControlItems, registerPanelItems } from "./core"
import { registerConfigProviders } from "./organization"

export function registerAll() {
  registerHomePage()
  registerPanelControlItems()
  registerPanelItems()
  registerConfigProviders()
}
