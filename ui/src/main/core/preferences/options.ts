import { app, ipcMain } from "electron"
import optionsManager from "./OptionsManager"

optionsManager.registerOption({
  id: "minimizeToTrayOnClose",
  label: "Minimize to tray when closing the application",
  type: "boolean",
  defaultValue: false
})

app.whenReady().then(() => {
  ipcMain.handle("core:options:get", async (_event, key: string) => {
    return optionsManager.get(key)
  })

  ipcMain.handle("core:options:set", async (_event, key: string, value: boolean) => {
    return optionsManager.set(key, value)
  })

  ipcMain.handle("core:options:getAll", async () => {
    return optionsManager.getAll()
  })
})
