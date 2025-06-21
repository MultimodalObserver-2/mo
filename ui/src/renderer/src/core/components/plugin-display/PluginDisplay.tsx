import { cloneElement, isValidElement, useState } from "react"
import styles from "./plugin-display.module.css"
import { findChildByDisplayName } from "@renderer/core/utils/findChildByDisplayName"
import { PluginDisplayHeaderProps } from "./PluginDisplayHeader"

interface PluginDisplayProps {
  /** The child elements. Should include `PluginDisplayHeader` and `PluginDisplayList`. */
  children: React.ReactNode
  /** An optional CSS class to apply to the main container. */
  className?: string
  /** The color theme variant for the component. */
  style?: "light" | "dark"
  /** The font size variant for the component's text. */
  textSize?: "sm" | "md"
  /** Optional flag to indicate if the component is expandable. */
  isExpandable?: boolean
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
 * @param {boolean} [props.isExpandable=false] - Optional flag to indicate if the component is expandable.
 * @returns {React.ReactElement} The rendered plugin display component.
 */
export default function PluginDisplay({
  children,
  className,
  style = "light",
  textSize = "md",
  isExpandable = false
}: Readonly<PluginDisplayProps>) {
  const [isExpanded, setIsExpanded] = useState(true)
  const header = findChildByDisplayName(
    children,
    "PluginDisplayHeader"
  ) as React.ReactElement<PluginDisplayHeaderProps>
  const list = findChildByDisplayName(children, "PluginDisplayList")
  let finalHeader = header
  if (isExpandable && isValidElement(header)) {
    finalHeader = cloneElement(header, {
      isExpandable: true,
      isExpanded,
      onToggleExpand: () => setIsExpanded((prev) => !prev)
    })
  }

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
      {finalHeader}
      {isExpanded && list}
    </div>
  )
}
