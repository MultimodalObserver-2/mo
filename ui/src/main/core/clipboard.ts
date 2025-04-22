import { app, clipboard, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:clipboard:write-text", (_event, text: string) => {
    clipboard.writeText(text)
  })
})
