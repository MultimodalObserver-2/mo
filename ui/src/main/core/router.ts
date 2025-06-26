import { app, ipcMain } from "electron"
import { getMainWindow } from ".."

app.whenReady().then(() => {
  ipcMain.on("core:router:navigate", (_event, path, options) => {
    getMainWindow()?.webContents.send("core:router:on-navigate", path, options)
  })
})
