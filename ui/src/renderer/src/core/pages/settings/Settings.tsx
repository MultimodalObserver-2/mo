import { useTranslation } from "react-i18next"
import HotkeysSettings from "./hotkeys/HotkeysSettings"
import Options from "./options/Options"
import styles from "./settings.module.css"
import LanguageSetting from "./language/LanguageSetting"

export default function SettingsPage() {
  const { t } = useTranslation("core", { keyPrefix: "pages.settings" })

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>{t("title")}</h1>
      <section className={styles.settings}>
        <LanguageSetting />
        <Options />
        <HotkeysSettings />
      </section>
    </main>
  )
}
