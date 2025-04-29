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
    errorMessage = error.response.data.detail
  }
  window.core.dialog.showErrorBox("Error", errorMessage)
}

export function showLockedErrorMessage(action: string, item: string) {
  window.core.dialog.showErrorBox(
    "Locked",
    `You cannot ${action} a locked ${item}, please unlock it first`
  )
}
