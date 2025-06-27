import "./core/assets/main.css"

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter } from "react-router"
import { Provider } from "react-redux"
import store from "./store"
import App from "./app"
import { registerAll } from "./registrations"
import pluginManager from "./core/plugin/PluginManager"

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
