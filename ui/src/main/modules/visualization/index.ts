import { app, BrowserWindow, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("vis:reload-playback-configs", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("vis:on-reload-playback-configs")
    })
  })
})

import "./playbackControls"
