import styles from "./plugin-display.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"

interface PluginDisplayProps {
  /** The child elements. Should include `PluginDisplayHeader` and `PluginDisplayList`. */
  children: React.ReactNode
  /** An optional CSS class to apply to the main container. */
  className?: string
  /** The color theme variant for the component. */
  style?: "light" | "dark"
  /** The font size variant for the component's text. */
  textSize?: "sm" | "md"
}

/**
 * A compound component that serves as a container for displaying plugin
 * information. It expects `PluginDisplayHeader` and `PluginDisplayList` as
 * children and arranges them in a fixed layout.
 *
 * @param {React.ReactNode} props.children - The child elements. Should include `PluginDisplayHeader` and `PluginDisplayList`.
 * @param {string} [props.className] - An optional CSS class for the main container `div`.
 * @param {"light" | "dark"} [props.style="light"] - The color theme variant for the component.
 * @param {"sm" | "md"} [props.textSize="md"] - The font size variant for the component's text.
 * @returns {React.ReactElement} The rendered plugin display component.
 */
export default function PluginDisplay({
  children,
  className,
  style = "light",
  textSize = "md"
}: Readonly<PluginDisplayProps>) {
  const header = findChildByDisplayName(children, "PluginDisplayHeader")
  const list = findChildByDisplayName(children, "PluginDisplayList")

  const baseClass = styles["plugin-display"]
  const styleClass = styles[style]
  const textSizeClass = styles[`text-${textSize}`]
  const customClass = className ?? ""
  const overflowHidden = header && list ? styles["overflow-hidden"] : ""

  return (
    <div
      id="plugin-display"
      className={`${baseClass} ${styleClass} ${textSizeClass} ${customClass} ${overflowHidden}`}
    >
      {header}
      {list}
    </div>
  )
}
