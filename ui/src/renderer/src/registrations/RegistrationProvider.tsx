import { ReactNode, useEffect } from "react"

type RegistrationFn = () => void
type Props = {
  registrations: RegistrationFn[]
  children: ReactNode
}

export default function RegistrationProvider({ registrations, children }: Props) {
  useEffect(() => {
    registrations.forEach((fn) => fn())
  }, [registrations])

  return <>{children}</>
}
