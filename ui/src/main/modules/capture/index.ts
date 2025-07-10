import { app, BrowserWindow, ipcMain } from "electron"
import { captureTray } from "./CaptureSystemTray"
import optionsManager from "../../core/preferences/OptionsManager"
import { getMainWindow } from "../.."

app.whenReady().then(() => {
  ipcMain.on("capture:reload-configs", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("capture:on-reload-configs")
    })
  })

  ipcMain.on("capture:reload-sessions", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("capture:on-reload-sessions")
    })
  })

  ipcMain.on("capture:reload-status", async (_, status) => {
    const { isCapturing, isPaused } = status
    captureTray.updateStatusFromRenderer(isCapturing, isPaused)
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("capture:on-reload-status")
    })
  })

  ipcMain.on("organization:set-project", (_, projectName: string) => {
    captureTray.setProject(projectName)
  })

  ipcMain.on("organization:set-participant", (_, participantCode: string) => {
    captureTray.setParticipant(participantCode)
  })

  optionsManager.registerOption({
    id: "capture:minimizeOnStartCapture",
    label: "Minimize the application on start capture",
    type: "boolean",
    defaultValue: false
  })

  captureTray.onStartCapture(() => {
    const minimizeOnStart = optionsManager.get("capture:minimizeOnStartCapture")
    if (minimizeOnStart) {
      const mainWindow = getMainWindow()
      if (mainWindow) {
        mainWindow.minimize()
      }
    }
  })

  optionsManager.registerOption({
    id: "capture:showOnCaptureStop",
    label: "Show the application window when capture stops",
    type: "boolean",
    defaultValue: true
  })

  captureTray.onStopCapture(() => {
    const showOnStop = optionsManager.get("capture:showOnCaptureStop")
    if (showOnStop) {
      const mainWindow = getMainWindow()
      if (mainWindow && !mainWindow.isVisible()) {
        mainWindow.show()
      }
    }
  })
})
