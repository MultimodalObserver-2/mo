import styles from "./plugins.module.css"

import Tabs from "@renderer/core/components/tabs/Tabs"
import Tab from "@renderer/core/components/tabs/Tab"
import Register from "./Register"
import Installed from "./Installed"
import Repository from "./repository/Repository"
import { useTranslation } from "react-i18next"
import { useMatch } from "react-router"

const REPOSITORY_TAB_INDEX = 1

export default function PluginsPage() {
  const { t } = useTranslation("core", { keyPrefix: "pages.plugins" })
  const isRepositoryRoute = useMatch("/plugins/repository/:pluginSlug")

  return (
    <main className={styles.main}>
      <Tabs defaultIndex={isRepositoryRoute ? REPOSITORY_TAB_INDEX : 0}>
        <Tab title={t("installed")} key="installed">
          <Installed />
        </Tab>
        <Tab title={t("repository")} key="repository">
          <Repository />
        </Tab>
        <Tab title={t("register")} key="register">
          <Register />
        </Tab>
      </Tabs>
    </main>
  )
}
