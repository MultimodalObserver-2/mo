import { app, dialog, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:show-error-box", (_event, { title, content }) => {
    dialog.showErrorBox(title, content)
  })
})
