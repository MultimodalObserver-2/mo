interface ShowProps {
  /** Whether to render the children or not */
  show: boolean
  /** Content to conditionally display */
  children: React.ReactNode
}

/** Conditionally renders children based on the `show` flag */
export default function Show({ show, children }: Readonly<ShowProps>) {
  return <>{show && <>{children}</>}</>
}
