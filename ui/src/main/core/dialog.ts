import { app, dialog, ipcMain, MessageBoxOptions } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:show-error-box", (_event, { title, content }) => {
    dialog.showErrorBox(title, content)
  })

  ipcMain.handle("core:show-message-box", async (_event, options: MessageBoxOptions) => {
    return await dialog.showMessageBox(options)
  })
})
