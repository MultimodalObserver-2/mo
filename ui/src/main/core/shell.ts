import { app, ipcMain, shell } from "electron"

app.whenReady().then(() => {
  ipcMain.on("core:shell:open-path", (_event, path: string) => {
    shell.openPath(path)
  })
})
