import styles from "./sidebar.module.css"
import SidebarItem from "./sidebar-item/SidebarItem"
import StacksIcon from "../icons/StacksIcon"
import ExtensionIcon from "../icons/ExtensionIcon"
import SettingsIcon from "../icons/SettingsIcon"

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <section className={styles.features}>
        <SidebarItem path="/" Icon={StacksIcon} />
        <SidebarItem path="/plugins" Icon={ExtensionIcon} />
      </section>
      <section className={styles.utils}>
        <SidebarItem path="/settings" Icon={SettingsIcon} />
      </section>
    </aside>
  )
}
