import { app, BrowserWindow, ipcMain } from "electron"
import protocolExecution from "./ProtocolExecution"
import "./preferences"
import { captureTray } from "../capture/CaptureSystemTray"
import optionsManager from "../../core/preferences/OptionsManager"

app.whenReady().then(() => {
  ipcMain.on("organization:reload-projects", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-reload-projects")
    })
  })

  ipcMain.on("organization:reload-participants", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-reload-participants")
    })
  })

  ipcMain.on("organization:change-selected-project", async (_event, project) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-change-selected-project", project)
    })
  })

  ipcMain.on("organization:change-selected-participant", async (_event, participant) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-change-selected-participant", participant)
    })
  })

  ipcMain.on("organization:add-activity", async (_event, activity) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-add-activity", activity)
    })
  })

  ipcMain.on("organization:update-activity", async (_event, originalName, activity) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-update-activity", originalName, activity)
    })
  })

  ipcMain.on("organization:reload-protocols", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-reload-protocols")
    })
  })

  ipcMain.on("organization:change-selected-protocol", async (_event, protocol) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-change-selected-protocol", protocol)
    })
  })

  ipcMain.on("organization:exec-protocol", async (_event, projectName, protocolName) => {
    protocolExecution.start(projectName, protocolName)
  })

  ipcMain.on("organization:stop-protocol-execution", () => {
    protocolExecution.stop()
  })

  ipcMain.handle("organization:get-protocol-execution-status", () => {
    return protocolExecution.getStatus()
  })

  let protocolNameExec: string | null = null
  ipcMain.on("organization:set-protocol", async (_event, protocolName: string | null) => {
    protocolNameExec = protocolName
  })

  optionsManager.registerOption({
    id: "organization:startProtocolOnCapture",
    defaultValue: false,
    label: "Start protocol execution when capture starts",
    type: "boolean"
  })

  captureTray.onStartCapture((projectName) => {
    if (!optionsManager.get("organization:startProtocolOnCapture")) {
      return
    }

    if (!projectName || !protocolNameExec) {
      console.warn("Cannot start protocol execution: projectName or protocolName is missing.")
      return
    }
    protocolExecution.start(projectName, protocolNameExec)
  })

  optionsManager.registerOption({
    id: "organization:stopProtocolOnStopCapture",
    defaultValue: false,
    label: "Stop protocol execution when capture stops",
    type: "boolean"
  })

  captureTray.onStopCapture(() => {
    if (!optionsManager.get("organization:stopProtocolOnStopCapture")) {
      return
    }
    protocolExecution.stop()
  })
})
