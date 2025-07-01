/**
 * @module core/shell
 * @description Provides functions to interact with the system shell.
 */

import { app, ipcMain, shell } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:shell:open-path", (_event, path: string) => {
    shell.openPath(path)
  })
})
