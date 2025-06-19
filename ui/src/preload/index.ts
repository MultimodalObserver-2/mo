import { contextBridge } from "electron"
import { electronAPI } from "@electron-toolkit/preload"
/**
 * Import here all the modules that you want to expose to the renderer process.
 */
import "./core/index"
import "./modules/organization/index"
import "./modules/capture/index"
import "./modules/visualization/index"

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
