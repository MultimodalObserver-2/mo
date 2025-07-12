import { app, ipcMain } from "electron"
import { getI18nConfig } from "./config"
import fs from "fs"
import i18n from "./i18n"
import preferencesManager from "../preferences/PreferencesManager"
import languageObserver from "./LanguageObserver"
import path from "path"

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

  ipcMain.handle(
    "core:i18n:loadResource",
    async (_event, basePath, localesPath, language, name = "translation.json") => {
      const resourcePath = path.join(basePath, localesPath, language, name)
      try {
        const rawResource = fs.readFileSync(resourcePath, "utf-8")
        const resource = JSON.parse(rawResource)
        return resource
      } catch (error) {
        console.error("Error loading resource:", error)
        throw new Error(`Failed to load resource from ${resourcePath}`)
      }
    }
  )
})
