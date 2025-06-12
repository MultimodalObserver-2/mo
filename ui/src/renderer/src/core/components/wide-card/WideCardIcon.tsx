import styles from "./wide-card.module.css"

interface WideCardProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

/**
 * A sub-component for `WideCard` that renders the card's icon. It is a
 * styled `<img>` element and accepts all standard image attributes.
 *
 * @param {string} [props.className] - An optional CSS class to apply to the `<img>` element.
 * @param {string} [props.alt] - The alternative text for the image, used for accessibility.
 * @param {object} props....props - Any other standard `<img>` attributes, such as `src` and `alt`.
 * @returns {React.ReactElement} The rendered card icon component.
 */
function WideCardIcon({ className, alt, ...props }: WideCardProps) {
  return <img className={`${styles.icon} ${className}`} alt={alt ?? ""} {...props} />
}

WideCardIcon.displayName = "WideCardIcon"
export default WideCardIcon
