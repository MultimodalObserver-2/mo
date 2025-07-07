import { app, ipcMain } from "electron"
import preferencesManager from "./PreferencesManager"

app.whenReady().then(() => {
  ipcMain.handle("core:preferences:get", async (_event, key: string) => {
    return preferencesManager.get(key)
  })

  ipcMain.handle("core:preferences:set", async (_event, key: string, value: unknown) => {
    preferencesManager.set(key, value)
  })

  ipcMain.handle("core:preferences:remove", async (_event, key: string) => {
    preferencesManager.remove(key)
  })

  ipcMain.handle("core:preferences:getAll", async () => {
    return preferencesManager.getAll()
  })

  ipcMain.handle("core:preferences:reset", async () => {
    preferencesManager.reset()
  })

  ipcMain.handle("core:preferences:has", async (_event, key: string) => {
    return preferencesManager.has(key)
  })

  ipcMain.handle(
    "core:preferences:extend",
    async (_event, key: string, partialValue: Record<string, unknown>) => {
      preferencesManager.extend(key, partialValue)
    }
  )
})
