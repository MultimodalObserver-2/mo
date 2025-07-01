/**
 * @module core/clipboard
 * @description Provides functions to interact with the system clipboard.
 */

import { app, clipboard, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:clipboard:write-text", (_event, text: string) => {
    clipboard.writeText(text)
  })
})
