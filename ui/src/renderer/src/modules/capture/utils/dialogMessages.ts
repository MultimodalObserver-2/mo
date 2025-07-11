/**
 * @module dialogMessages
 * This file contains utility functions for displaying specific confirmation
 * dialogs before performing destructive actions, such as deleting capture
 * configurations or sessions. It uses the Electron dialog API exposed
 * at `window.core.dialog`.
 */
import i18n from "i18next"

const t = i18n.getFixedT(null, "capture", "dialogs")

export async function showDeleteCaptureConfigMessage(
  configName: string,
  projectName: string,
  acceptId: number
) {
  const buttons = [t("buttons.accept"), t("buttons.cancel")]
  const options: Electron.MessageBoxOptions = {
    title: t("delete.captureConfig.title"),
    message: t("delete.captureConfig.message", { configName, projectName }),
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}

export async function showDeleteSessionMessage(
  sessionId: string,
  projectName: string,
  participantCode: string,
  acceptId: number
) {
  const buttons = [t("buttons.accept"), t("buttons.cancel")]
  const options: Electron.MessageBoxOptions = {
    title: t("delete.session.title"),
    message: t("delete.session.message", { sessionId, projectName, participantCode }),
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}
