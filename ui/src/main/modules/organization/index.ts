import { BrowserWindow, ipcMain } from "electron"

ipcMain.on("organization:reload-projects", async () => {
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send("organization:on-reload-projects")
  })
})
