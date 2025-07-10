/**
 * @fileoverview
 * Main entry point for the React renderer process.
 *
 * This file initializes the Redux store, plugin manager, and static registries,
 * and renders the root React application with routing and global providers.
 *
 * - Calls `registerAll()` to ensure all core and module registries are populated before rendering.
 * - Loads all plugins using the PluginManager.
 * - Wraps the app in Redux Provider and HashRouter for state and routing support.
 *
 * This is the recommended place to perform any static app initialization
 * before the UI is rendered.
 */

import "./core/assets/main.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router"
import { Provider } from "react-redux"
import store from "./utils/store"
import App from "./app"
import { registerAll } from "./registrations"
import pluginManager from "./core/plugin/PluginManager"
import "./utils/i18n"

registerAll()
pluginManager.loadAllPlugins()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  </StrictMode>
)
