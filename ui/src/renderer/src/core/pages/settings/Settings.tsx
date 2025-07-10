import HotkeysSettings from "./hotkeys/HotkeysSettings"
import Options from "./options/Options"
import styles from "./settings.module.css"

export default function SettingsPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Settings</h1>
      <Options />
      <HotkeysSettings />
    </main>
  )
}
