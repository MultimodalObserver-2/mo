import { app, BrowserWindow, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("vis:reload-playback-configs", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("vis:on-reload-playback-configs")
    })
  })

  ipcMain.on("vis:update-panel-parameters", (_event, params) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("vis:on-update-panel-parameters", params)
    })
  })

  ipcMain.on("vis:update-config-visibility", (_event, configId, visible) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("vis:on-update-config-visibility", configId, visible)
    })
  })
})

import "./playbackControls"
