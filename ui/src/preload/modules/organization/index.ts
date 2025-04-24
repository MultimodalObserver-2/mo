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
  },
  changeSelectedProject: (project) => {
    ipcRenderer.send("organization:change-selected-project", project)
  },
  onChangeSelectedProject: (callback: (project) => void) => {
    ipcRenderer.on("organization:on-change-selected-project", (_, project) => callback(project))
  },
  changeSelectedParticipant: (participant) => {
    ipcRenderer.send("organization:change-selected-participant", participant)
  },
  onChangeSelectedParticipant: (callback: (participant) => void) => {
    ipcRenderer.on("organization:on-change-selected-participant", (_, participant) =>
      callback(participant)
    )
  }
}

contextBridge.exposeInMainWorld("organization", organization)
