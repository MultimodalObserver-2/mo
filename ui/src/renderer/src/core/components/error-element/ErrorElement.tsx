import { useTranslation } from "react-i18next"
import { useAsyncError } from "react-router"

interface ErrorElementProps {
  /** Name of the component or route where the error occurred */
  name: string
}

/**
 * A React Router error boundary component that catches and displays asynchronous
 * errors from loaders or actions using the `useAsyncError` hook.
 *
 * @param {string} props.name - A descriptive name of the route or component where the error originated.
 * @returns {React.ReactElement} The rendered error message component.
 */
export default function ErrorElement({ name }: Readonly<ErrorElementProps>) {
  const { t } = useTranslation("core", { keyPrefix: "components.errorElement" })
  const error = useAsyncError()

  if (error instanceof Error) {
    return (
      <div>
        {t("componentError", { name })}: {error.message}
      </div>
    )
  }

  return <div>{t("unknownError")}</div>
}
