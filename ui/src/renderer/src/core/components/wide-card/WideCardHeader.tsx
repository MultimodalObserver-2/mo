import styles from "./wide-card.module.css"

interface WideCardHeaderProps {
  /** The content of the header, such as a title. */
  children: React.ReactNode
  /** An optional CSS class to apply to the container. */
  className?: string
}

/**
 * A sub-component for `WideCard` that serves as the header container. It is
 * typically used to hold the card's main title.
 *
 * @param {React.ReactNode} props.children - The content to be displayed in the header.
 * @param {string} [props.className] - An optional CSS class to apply to the header's `<div>` container.
 * @returns {React.ReactElement} The rendered card header component.
 */
function WideCardHeader({ children, className }: Readonly<WideCardHeaderProps>) {
  return <div className={`${styles.header} ${className}`}>{children}</div>
}

WideCardHeader.displayName = "WideCardHeader"
export default WideCardHeader
