import styles from "./plugins.module.css"

import Tabs from "@renderer/core/components/tabs/Tabs"
import Tab from "@renderer/core/components/tabs/Tab"
import Register from "./Register"
import Installed from "./Installed"
import Repository from "./repository/Repository"
import { useTranslation } from "react-i18next"

export default function PluginsPage() {
  const { t } = useTranslation("core", { keyPrefix: "pages.plugins" })

  return (
    <main className={styles.main}>
      <Tabs>
        <Tab title={t("installed")} key="installed">
          <Installed />
        </Tab>
        <Tab title={t("register")} key="register">
          <Register />
        </Tab>
        <Tab title={t("repository")} key="repository">
          <Repository />
        </Tab>
      </Tabs>
    </main>
  )
}
