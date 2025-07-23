import { ComponentType } from "react"
import styles from "./sidebar-item.module.css"
import { NavLink } from "react-router"
import { IconProps } from "../../icons/IconProps"

interface SidebarItemProps {
  /** The URL path the item navigates to. */
  path: string
  /** The icon component to be displayed for the navigation link. */
  Icon: ComponentType<IconProps>
  /** Test id */
  testid?: string 
}

/**
 * Renders a single navigable item for the `Sidebar`. It wraps a `NavLink`
 * from React Router to provide active-state styling and displays a given icon.
 *
 * @param {string} props.path - The destination URL path for the `NavLink`.
 * @param {ComponentType<IconProps>} props.Icon - The React component to be used as the item's icon.
 * @returns {React.ReactElement} The rendered sidebar navigation link.
 */
export default function SidebarItem({ path, Icon, testid }: Readonly<SidebarItemProps>) {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive ? `${styles.active} ${styles.link}` : `${styles.link}`
      }
      to={path}
      data-testid={testid}
    >
      <Icon className={styles.icon} />
    </NavLink>
  )
}
