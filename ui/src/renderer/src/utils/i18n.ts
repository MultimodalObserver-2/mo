import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const i18nConfig = await window.core.i18n.getInitialData()

i18n.use(initReactI18next)

if (!i18n.isInitialized) {
  i18n.init({
    resources: i18nConfig.resources,
    lng: i18nConfig.lng,
    fallbackLng: i18nConfig.fallbackLng,
    ns: i18nConfig.ns,
    fallbackNS: i18nConfig.fallbackNS,
    interpolation: {
      escapeValue: false
    }
  })
}
