import { app, ipcMain } from "electron"
import { getI18nConfig } from "./config"
import i18n from "./i18n"
import preferencesManager from "../preferences/PreferencesManager"
import languageObserver from "./LanguageObserver"

app.whenReady().then(() => {
  ipcMain.handle("core:i18n:getInitialData", async () => {
    const resources = i18n.services.resourceStore.data
    const i18nConfig = getI18nConfig()
    return {
      ...i18nConfig,
      resources: resources
    }
  })

  ipcMain.handle("core:i18n:changeLanguage", async (_event, language) => {
    return new Promise((resolve, reject) => {
      i18n.changeLanguage(language, (err) => {
        if (err) {
          console.error("Error changing language:", err)
          reject(err)
        } else {
          preferencesManager.set("language", language)
          languageObserver.notify(language)
          const resources = {}
          const i18nConfig = getI18nConfig()
          for (const ns of i18nConfig.ns) {
            resources[ns] = i18n.getResourceBundle(language, ns)
          }
          resolve({ language, resources })
        }
      })
    })
  })
})
