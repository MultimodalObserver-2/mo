import styles from "./sidebar.module.css"
import SidebarItem from "./sidebar-item/SidebarItem"
import StacksIcon from "../icons/StacksIcon"
import ExtensionIcon from "../icons/ExtensionIcon"
import SettingsIcon from "../icons/SettingsIcon"
import { useSelector } from "react-redux"
import { selectMainUrl } from "@renderer/core/store/mainUrlSlice"

/**
 * A static layout component that renders the main application sidebar.
 * It includes navigation links for primary features and utility sections.
 *
 * @returns {React.ReactElement} The rendered sidebar component.
 */
export default function Sidebar() {
  const mainUrl = useSelector(selectMainUrl)

  return (
    <aside className={styles.sidebar}>
      <section className={styles.features}>
        <SidebarItem testid="sidebar-main-link" path={mainUrl} Icon={StacksIcon} />
        <SidebarItem testid="sidebar-plugins-link" path="/plugins" Icon={ExtensionIcon} />
      </section>
      <section className={styles.utils}>
        <SidebarItem path="/settings" Icon={SettingsIcon} />
      </section>
    </aside>
  )
}
