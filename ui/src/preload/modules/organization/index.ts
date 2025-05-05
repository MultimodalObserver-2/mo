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
  },
  addActivity: (activity) => {
    ipcRenderer.send("organization:add-activity", activity)
  },
  onAddActivity: (callback: (activity) => void) => {
    ipcRenderer.on("organization:on-add-activity", (_, activity) => callback(activity))
  },
  removeAddActivity: () => {
    ipcRenderer.removeAllListeners("organization:on-add-activity")
  },
  updateActivity: (originalName, activity) => {
    ipcRenderer.send("organization:update-activity", originalName, activity)
  },
  onUpdateActivity: (callback: (originalName, activity) => void) => {
    ipcRenderer.on("organization:on-update-activity", (_, originalName, activity) =>
      callback(originalName, activity)
    )
  },
  removeUpdateActivity: () => {
    ipcRenderer.removeAllListeners("organization:on-update-activity")
  },
  reloadProtocols: () => {
    ipcRenderer.send("organization:reload-protocols")
  },
  onReloadProtocols: (callback: () => void) => {
    ipcRenderer.on("organization:on-reload-protocols", () => callback())
  },
  removeReloadProtocols: () => {
    ipcRenderer.removeAllListeners("organization:on-reload-protocols")
  },
  changeSelectedProtocol: (protocol) => {
    ipcRenderer.send("organization:change-selected-protocol", protocol)
  },
  onChangeSelectedProtocol: (callback: (protocol) => void) => {
    ipcRenderer.on("organization:on-change-selected-protocol", (_, protocol) => callback(protocol))
  }
}

contextBridge.exposeInMainWorld("organization", organization)
