/**
 * @module dialogMessages
 * Utility functions to display error dialogs using Electron's dialog API.
 * Includes generic errors, API error parsing, and locked item warnings.
 */
import { AxiosError } from "axios"
import i18n from "i18next"
const t = i18n.getFixedT(null, "core", "dialogs")

export function showUnexpectedErrorMessage() {
  window.core.dialog.showErrorBox(
    t("errors.unexpected.title", "Unexpected Error"),
    t("errors.unexpected.message", "An unexpected error occurred, please restart the app")
  )
}

/**
 * Extracts a human-readable message from an error, preferring the API error detail
 * (`error.response.data.detail`) returned by the backend over the generic Axios message.
 */
export function getApiErrorMessage(error: unknown): string {
  let errorMessage = "An unexpected error occurred"
  if (error instanceof AxiosError && error.response?.data.detail) {
    if (typeof error.response.data.detail === "string") {
      errorMessage = error.response.data.detail
    } else {
      errorMessage = error.response.statusText
    }
  } else if (error instanceof Error) {
    errorMessage = error.message
  }
  return errorMessage
}

export function showApiErrorMessage(error: unknown) {
  window.core.dialog.showErrorBox("Error", getApiErrorMessage(error))
}

export function showLockedErrorMessage(action: string, item: string) {
  window.core.dialog.showErrorBox(
    t("errors.locked.title", "Locked"),
    t("errors.locked.description", { action, item })
  )
}

export async function showDeletePluginMessage(
  pluginName: string,
  pluginPublisher: string,
  pluginVersion: string,
  acceptId: number
) {
  const buttons = [t("buttons.accept"), t("buttons.cancel")]
  const options: Electron.MessageBoxOptions = {
    title: t("delete.plugin.title", "Delete Plugin"),
    message: t("delete.plugin.message", {
      pluginName: pluginName,
      pluginVersion: pluginVersion,
      pluginPublisher: pluginPublisher
    }),
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}
