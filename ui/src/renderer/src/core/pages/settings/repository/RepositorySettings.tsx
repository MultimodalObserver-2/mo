import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import SettingsGroup from "../SettingsGroup"
import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import pluginRepositoryService, {
  DEFAULT_REPOSITORY_URL
} from "@renderer/core/services/PluginRepositoryService"
import styles from "./repository-settings.module.css"

export default function RepositorySettings() {
  const { t } = useTranslation("core", { keyPrefix: "pages.settings.repository" })
  const [url, setUrl] = useState(DEFAULT_REPOSITORY_URL)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.core.preferences.get("pluginRepository:url").then((savedUrl) => {
      if (savedUrl) setUrl(savedUrl as string)
    })
  }, [])

  const handleSave = () => {
    window.core.preferences.set("pluginRepository:url", url)
    pluginRepositoryService.setBaseUrl(url)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setUrl(DEFAULT_REPOSITORY_URL)
    setSaved(false)
  }

  return (
    <SettingsGroup title={t("title")}>
      <div className={styles.container}>
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setSaved(false)
          }}
          styleType="primary"
          className={styles.input}
        />
        <div className={styles.actions}>
          <Button onClick={handleSave} styleType="default">
            {saved ? t("saved") : t("save")}
          </Button>
          <Button onClick={handleReset} styleType="soft">
            {t("reset")}
          </Button>
        </div>
      </div>
    </SettingsGroup>
  )
}
