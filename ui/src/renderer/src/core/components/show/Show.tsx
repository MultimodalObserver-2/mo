interface ShowProps {
  show: boolean
  children: React.ReactNode
}

export default function Show({ show, children }: Readonly<ShowProps>) {
  return <>{show && <>{children}</>}</>
}
