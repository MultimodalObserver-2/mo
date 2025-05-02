import { app, dialog, ipcMain, MessageBoxOptions, OpenDialogOptions } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:show-error-box", (_event, { title, content }) => {
    dialog.showErrorBox(title, content)
  })

  ipcMain.handle("core:show-message-box", async (_event, options: MessageBoxOptions) => {
    return await dialog.showMessageBox(options)
  })

  ipcMain.handle("core:show-open-dialog", async (_event, options: OpenDialogOptions) => {
    return await dialog.showOpenDialog(options)
  })
})
