import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import SettingsGroup from "../SettingsGroup"
import Input from "@renderer/core/components/input/Input"
import Button from "@renderer/core/components/button/Button"
import pluginRepositoryService, {
  DEFAULT_REPOSITORY_HOST,
  normalizeHost
} from "@renderer/core/services/PluginRepositoryService"
import styles from "./repository-settings.module.css"

export default function RepositorySettings() {
  const { t } = useTranslation("core", { keyPrefix: "pages.settings.repository" })
  const [host, setHost] = useState(DEFAULT_REPOSITORY_HOST)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    window.core.preferences.get("pluginRepository:host").then((savedHost) => {
      if (savedHost) setHost(savedHost as string)
    })
  }, [])

  const handleSave = () => {
    // Snapping to the canonical host keeps a pasted URL from being stored as-is, and
    // shows the user the format the field actually expects.
    const normalized = normalizeHost(host) || DEFAULT_REPOSITORY_HOST
    setHost(normalized)
    window.core.preferences.set("pluginRepository:host", normalized)
    pluginRepositoryService.setHost(normalized)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    setHost(DEFAULT_REPOSITORY_HOST)
    setSaved(false)
  }

  return (
    <SettingsGroup title={t("title")}>
      <div className={styles.container}>
        <Input
          value={host}
          // Not translated: it is the build's own default host, not a message.
          placeholder={DEFAULT_REPOSITORY_HOST}
          onChange={(e) => {
            setHost(e.target.value)
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
