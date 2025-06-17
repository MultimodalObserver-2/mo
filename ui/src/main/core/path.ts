import { app, ipcMain } from "electron"
import path from "path"

app.whenReady().then(() => {
  ipcMain.handle("core:path:join", (_event, ...paths: string[]) => {
    return path.join(...paths)
  })

  ipcMain.handle("core:path:basename", (_event, filePath: string) => {
    return path.basename(filePath)
  })
})
