import i18n from "i18next"
import Backend from "i18next-fs-backend"
import { i18nConfig } from "./config"
import { getLocalesPath } from "../appPaths"
import path from "path"
import { is } from "@electron-toolkit/utils"

export async function initI18n() {
  i18n.use(Backend)

  const loadPath = path.join(getLocalesPath(), "{{lng}}", "{{ns}}.json")

  if (!i18n.isInitialized) {
    await i18n.init({
      lng: i18nConfig.lng,
      fallbackLng: i18nConfig.fallbackLng,
      ns: i18nConfig.ns,
      fallbackNS: i18nConfig.fallbackNS,
      backend: {
        loadPath: loadPath
      },
      interpolation: {
        escapeValue: false
      },
      debug: is.dev
    })
  }
}

export default i18n
