import { app, ipcMain } from "electron"
import optionsManager from "./OptionsManager"
import i18n from "../i18n/i18n"
import languageObserver from "../i18n/LanguageObserver"

app.whenReady().then(() => {
  const tCoreOptions = i18n.getFixedT(null, "core", "options")

  optionsManager.registerOption({
    id: "minimizeToTrayOnClose",
    label: tCoreOptions("minimizeToTrayOnClose"),
    type: "boolean",
    defaultValue: false
  })

  languageObserver.subscribe(() => {
    optionsManager.updateOption("minimizeToTrayOnClose", {
      label: tCoreOptions("minimizeToTrayOnClose")
    })
  })

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
