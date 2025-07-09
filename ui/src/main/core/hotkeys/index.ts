import { app, ipcMain } from "electron"
import hotkeysManager from "./HotkeysManager"

app.whenReady().then(() => {
  ipcMain.handle("core:hotkeys:getAll", async () => {
    return hotkeysManager.getAll()
  })

  ipcMain.handle("core:hotkeys:get", async (_event, actionId: string) => {
    return hotkeysManager.getHotkey(actionId)
  })

  ipcMain.handle("core:hotkeys:set", async (_event, actionId: string, keyCombination: string) => {
    return hotkeysManager.setHotkey(actionId, keyCombination)
  })

  ipcMain.handle("core:hotkeys:reset", async (_event, actionId: string) => {
    hotkeysManager.resetHotkey(actionId)
  })

  ipcMain.handle("core:hotkeys:disable", () => {
    hotkeysManager.disable()
  })

  ipcMain.handle("core:hotkeys:enable", () => {
    hotkeysManager.enable()
  })
})

export { hotkeysManager }
