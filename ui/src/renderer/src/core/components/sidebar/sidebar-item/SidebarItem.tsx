import { ComponentType } from "react"
import styles from "./sidebar-item.module.css"
import { NavLink } from "react-router"
import { IconProps } from "../../icons/IconProps"

interface SidebarItemProps {
  path: string
  Icon: ComponentType<IconProps>
}

export default function SidebarItem({ path, Icon }: SidebarItemProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive ? `${styles.active} ${styles.link}` : `${styles.link}`
      }
      to={path}
    >
      <Icon className={styles.icon} />
    </NavLink>
  )
}
