import { app, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.handle("core:app:version", () => {
    return app.getVersion()
  })
})
