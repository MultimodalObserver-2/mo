import { app, BrowserWindow, ipcMain } from "electron"

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
})
