import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const i18nConfig = await window.core.i18n.getInitialData()

interface SetLanguageResponse {
  success: boolean
  language: string
}

export async function setApiLanguage(
  lang: string
): Promise<AxiosResponse<SetLanguageResponse, unknown>> {
  return await axios.post("/set-language", { lang })
}

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

  setApiLanguage(i18nConfig.lng)
    .then((response) => {
      if (response.data.success) {
        console.log("Language set successfully on the server:", response.data.language)
      } else {
        console.error("Failed to set language on the server:", response.data)
      }
    })
    .catch((error) => {
      console.error("Failed to set language on the server:", error)
    })
}

export { i18n }
