/**
 * @fileoverview
 * i18n initialization and translation utility functions for the MO UI.
 *
 * This module initializes the i18next internationalization engine,
 * integrates it with react-i18next, and synchronizes the selected
 * language with the backend API. It also provides wrapper functions
 * for translation to be used across the application and by external plugins.
 *
 * Exports:
 * - `translate`: Wrapper for i18n's translation function.
 * - `getFixedTranslation`: Helper to get a namespaced translation function.
 * - `i18n`: The initialized i18next instance.
 */

import axios from "@renderer/core/lib/axios"
import { AxiosResponse } from "axios"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const i18nConfig = await window.core.i18n.getInitialData()

interface SetLanguageResponse {
  success: boolean
  language: string
}

/**
 * Sets the API language for the backend.
 *
 * @param lang - The language code to set (e.g., "en", "es").
 * @returns A promise resolving to the API response indicating the language was set.
 */
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

/**
 * Wrapper around `i18next.t` for string translation.
 *
 * Translates a key or array of keys using the current i18n configuration.
 *
 * @param key - The translation key or array of keys.
 * @param options - Optional interpolation or formatting options.
 * @returns The translated string.
 */
export function translate(key: string | string[], options?: Record<string, unknown>): string {
  return i18n.t(key, options)
}

/**
 * Wrapper around `i18next.getFixedT` for retrieving a namespaced translation function.
 *
 * Returns a fixed translation function for a specific language, namespace, and key prefix.
 * Useful for retrieving translations within a certain context or namespace.
 *
 * @param lng - The language(s) to use.
 * @param ns - The namespace(s) to use.
 * @param keyPrefix - Optional prefix for the translation keys.
 * @returns A translation function with the context fixed.
 */
export function getFixedTranslation(
  lng: string | null | readonly string[],
  ns: string | string[] | null,
  keyPrefix?: string | undefined
) {
  return i18n.getFixedT(lng, ns, keyPrefix)
}

export { i18n }
