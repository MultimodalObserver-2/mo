import { contextBridge, ipcRenderer } from "electron"

const organization = {
  reloadProjects: () => {
    ipcRenderer.send("organization:reload-projects")
  },
  onReloadProjects: (callback: () => void) => {
    ipcRenderer.on("organization:on-reload-projects", () => callback())
  }
}

contextBridge.exposeInMainWorld("organization", organization)
