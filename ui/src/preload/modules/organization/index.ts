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
  },
  execProtocol: (projectName, protocolName) => {
    ipcRenderer.send("organization:exec-protocol", projectName, protocolName)
  },
  onExecProtocolFinished: (callback: () => void) => {
    const listener = () => {
      callback()
    }
    ipcRenderer.on("organization:on-exec-protocol-finished", listener)
    return () => {
      ipcRenderer.removeListener("organization:on-exec-protocol-finished", listener)
    }
  },
  stopProtocolExecution: () => {
    ipcRenderer.send("organization:stop-protocol-execution")
  },
  getProtocolExecutionStatus: () => {
    return ipcRenderer.invoke("organization:get-protocol-execution-status")
  },
  activityMessageButtonClicked: (idx) => {
    ipcRenderer.send("organization:activity-message:button-clicked", idx)
  },
  setActivityMessageHeight: (height) => {
    ipcRenderer.send("organization:activity-message:set-height", height)
  },
  onActivityTimerChange: (callback: (seconds: number) => void) => {
    ipcRenderer.on("organization:on-activity-timer-change", (_, seconds) => callback(seconds))
  },
  onActivityTimerStart: (callback: (initialSeconds: number) => void) => {
    ipcRenderer.on("organization:on-activity-timer-start", (_, initialSeconds) =>
      callback(initialSeconds)
    )
  },
  onActivityTimerStop: (callback: () => void) => {
    ipcRenderer.on("organization:on-activity-timer-stop", () => callback())
  }
}

contextBridge.exposeInMainWorld("organization", organization)
