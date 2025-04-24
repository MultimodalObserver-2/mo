import { contextBridge, ipcRenderer } from "electron"

const organization = {
  reloadProjects: () => {
    ipcRenderer.send("organization:reload-projects")
  },
  onReloadProjects: (callback: () => void) => {
    ipcRenderer.on("organization:on-reload-projects", () => callback())
  },
  reloadParticipants: () => {
    ipcRenderer.send("organization:reload-participants")
  },
  onReloadParticipants: (callback: () => void) => {
    ipcRenderer.on("organization:on-reload-participants", () => callback())
  },
  removeReloadParticipants: () => {
    ipcRenderer.removeAllListeners("organization:on-reload-participants")
  }
}

contextBridge.exposeInMainWorld("organization", organization)
