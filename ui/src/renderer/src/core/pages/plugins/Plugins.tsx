import styles from "./plugins.module.css"

import Tabs from "@renderer/core/components/tabs/Tabs"
import Tab from "@renderer/core/components/tabs/Tab"
import Register from "./Register"
import Installed from "./Installed"

export default function PluginsPage() {
  return (
    <main className={styles.main}>
      <Tabs>
        <Tab title="Installed" key="installed">
          <Installed />
        </Tab>
        <Tab title="Register" key="register">
          <Register />
        </Tab>
        <Tab title="Available" key="available">
          <p style={{ color: "black" }}>Available</p>
        </Tab>
      </Tabs>
    </main>
  )
}
