import styles from "./plugin-display.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

export default function PluginDisplay({
  children,
  className,
  style = "light",
  textSize = "md"
}: {
  readonly children: React.ReactNode
  readonly className?: string
  readonly style?: "light" | "dark"
  readonly textSize?: "sm" | "md"
}) {
  const header = findChildByDisplayName(children, "PluginDisplayHeader")
  const list = findChildByDisplayName(children, "PluginDisplayList")

  return (
    <div
      id="plugin-display"
      className={`${styles["plugin-display"]} ${styles[style]} ${styles[`text-${textSize}`]} ${className}`}
    >
      {header}
      {list}
    </div>
  )
}
