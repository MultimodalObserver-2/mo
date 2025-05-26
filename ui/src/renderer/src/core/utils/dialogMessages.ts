/**
 * Utility functions to display error dialogs using Electron's dialog API.
 * Includes generic errors, API error parsing, and locked item warnings.
 */
import { AxiosError } from "axios"

export function showUnexpectedErrorMessage() {
  window.core.dialog.showErrorBox(
    "Unexpected error",
    "An unexpected error occurred, please restart the app"
  )
}

export function showApiErrorMessage(error: unknown) {
  let errorMessage = "An unexpected error occurred"
  if (error instanceof AxiosError && error.response?.data.detail) {
    if (typeof error.response.data.detail === "string") {
      errorMessage = error.response.data.detail
    } else {
      errorMessage = error.response.statusText
    }
  }
  window.core.dialog.showErrorBox("Error", errorMessage)
}

export function showLockedErrorMessage(action: string, item: string) {
  window.core.dialog.showErrorBox(
    "Locked",
    `You cannot ${action} a locked ${item}, please unlock it first`
  )
}

export async function showDeletePluginMessage(
  pluginName: string,
  pluginVersion: string,
  acceptId: number
) {
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Participant",
    message: `Are you sure you want to delete the plugin ${pluginName}` + ` (v${pluginVersion})?`,
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}
