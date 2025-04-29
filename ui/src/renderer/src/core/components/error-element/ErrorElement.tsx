import { useAsyncError } from "react-router"

interface ErrorElementProps {
  /** Name of the component or route where the error occurred */
  name: string
}

/** Displays error messages for components */
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
