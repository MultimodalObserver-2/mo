import { app, BrowserWindow, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:reload-plugins", () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("core:on-reload-plugins")
    })
  })
})
