import { app, ipcMain } from "electron"
import { broadcast } from "../.."

app.whenReady().then(() => {
  ipcMain.on("vis:playback:play", (_event, fromTimeMs) => {
    broadcast("vis:playback:on-play", fromTimeMs)
  })
  ipcMain.on("vis:playback:pause", () => {
    broadcast("vis:playback:on-pause")
  })
  ipcMain.on("vis:playback:seek", (_event, toTimeMs) => {
    broadcast("vis:playback:on-seek", toTimeMs)
  })
  ipcMain.on("vis:playback:sync", (_event, currentTimeMs) => {
    broadcast("vis:playback:on-sync", currentTimeMs)
  })
})
