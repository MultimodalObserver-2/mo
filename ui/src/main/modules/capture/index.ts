import { app, BrowserWindow, ipcMain } from "electron"
import { CaptureSystemTray } from "./CaptureSystemTray"

app.whenReady().then(() => {
  const captureTray = new CaptureSystemTray()

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
})
