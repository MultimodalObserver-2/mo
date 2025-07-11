import { app, BrowserWindow, ipcMain } from "electron"
import { captureTray } from "./CaptureSystemTray"
import optionsManager from "../../core/preferences/OptionsManager"
import { getMainWindow } from "../.."
import i18n from "../../core/i18n/i18n"
import languageObserver from "../../core/i18n/LanguageObserver"

const tCaptureOptions = i18n.getFixedT(null, "capture", "options")

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
    label: tCaptureOptions("MinimizeOnStart"),
    type: "boolean",
    defaultValue: false
  })

  languageObserver.subscribe(() => {
    optionsManager.updateOption("capture:minimizeOnStartCapture", {
      label: tCaptureOptions("MinimizeOnStart")
    })
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
    label: tCaptureOptions("ShowOnStop"),
    type: "boolean",
    defaultValue: true
  })

  languageObserver.subscribe(() => {
    optionsManager.updateOption("capture:showOnCaptureStop", {
      label: tCaptureOptions("ShowOnStop")
    })
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
