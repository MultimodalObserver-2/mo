import { useAsyncError } from "react-router"

interface ErrorElementProps {
  name: string
}

export default function ErrorElement({ name }: Readonly<ErrorElementProps>) {
  const error = useAsyncError()
  if (error instanceof Error) {
    return (
      <div>
        {name} error: {error.message}
      </div>
    )
  }

  return <div>Unknown error occurred</div>
}
