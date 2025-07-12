import styles from "./language-setting.module.css"
import Select from "@renderer/core/components/select/Select"
import SettingsGroup from "../SettingsGroup"
import { useTranslation } from "react-i18next"
import pluginManager from "@renderer/core/plugin/PluginManager"
import { setApiLanguage } from "@renderer/utils/i18n"

export default function LanguageSetting() {
  const { t, i18n } = useTranslation("core", { keyPrefix: "pages.settings.languages" })
  const SUPPORTED_LANGUAGES = [
    { code: "en", name: t("options.en") },
    { code: "es", name: t("options.es") }
  ]

  const handleChangeLanguage = async (selectedLanguage) => {
    try {
      const { language, resources } = await window.core.i18n.changeLanguage(selectedLanguage)
      if (!i18n.hasResourceBundle(selectedLanguage, "core")) {
        Object.entries(resources).forEach(([ns, data]) => {
          i18n.addResourceBundle(language, ns, data, true, true)
        })
      }
      i18n.changeLanguage(selectedLanguage, async (err) => {
        if (err) {
          console.error("Error changing language:", err)
        }
      })
    } catch (error) {
      console.error("Error changing language:", error)
    }

    try {
      pluginManager.loadAllPluginLanguageLocales(selectedLanguage)
    } catch (error) {
      console.error("Error loading plugin language locales:", error)
    }

    try {
      await setApiLanguage(selectedLanguage)
    } catch (error) {
      console.error("Error setting language on the API:", error)
    }
  }

  return (
    <SettingsGroup title={t("title")}>
      <Select
        className={styles.select}
        styleType="soft"
        onChange={(e) => {
          const selectedLanguage = e.target.value
          handleChangeLanguage(selectedLanguage)
        }}
        defaultValue={i18n.language}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </Select>
    </SettingsGroup>
  )
}
