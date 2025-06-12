interface ShowProps {
  /** Whether to render the children or not */
  show: boolean
  /** Content to conditionally display */
  children: React.ReactNode
}

/**
 * A utility component for conditional rendering. It renders its `children`
 * only when the `show` prop is true, providing a declarative alternative
 * to ternary operators or `&&` expressions in JSX.
 *
 * @param {boolean} props.show - The boolean condition that determines if the children are rendered.
 * @param {React.ReactNode} props.children - The content to display if the `show` condition is met.
 * @returns {React.ReactElement | null} The children if `show` is true, otherwise `null`.
 */
export default function Show({ show, children }: Readonly<ShowProps>) {
  return <>{show && <>{children}</>}</>
}
