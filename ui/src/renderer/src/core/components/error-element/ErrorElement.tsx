import { useAsyncError } from "react-router"

export default function ErrorElement({ name }: { name: string }) {
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
