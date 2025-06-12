import styles from "./wide-card.module.css"

interface WideCardDescriptionProps {
  /** The descriptive content of the card. */
  children: React.ReactNode
  /** An optional CSS class to apply to the container. */
  className?: string
}

/**
 * A sub-component for `WideCard` that serves as the main description or
 * content container. It renders its children inside a `<p>` tag.
 *
 * @param {React.ReactNode} props.children - The text or elements to be displayed as the card's description.
 * @param {string} [props.className] - An optional CSS class to apply to the description's `<p>` container.
 * @returns {React.ReactElement} The rendered card description component.
 */
function WideCardDescription({ children, className }: Readonly<WideCardDescriptionProps>) {
  return <p className={`${styles.description} ${className}`}>{children}</p>
}

WideCardDescription.displayName = "WideCardDescription"
export default WideCardDescription
