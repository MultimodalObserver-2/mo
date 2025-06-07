import { app, BrowserWindow, ipcMain } from "electron"

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

  ipcMain.on("capture:reload-status", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("capture:on-reload-status")
    })
  })
})
