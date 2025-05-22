import { app, BrowserWindow, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("capture:reload-settings", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("capture:on-reload-settings")
    })
  })
})
