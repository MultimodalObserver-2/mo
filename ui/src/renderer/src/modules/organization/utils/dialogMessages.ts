/**
 * @module dialogMessages
 * This file contains utility functions for displaying native dialogs and
 * message boxes throughout the application. It centralizes the logic for
 * confirmation dialogs (e.g., deletions) and common error messages, using the
 * Electron dialog API exposed at `window.core.dialog`.
 */

import i18n from "i18next"
const t = i18n.getFixedT(null, "organization", "dialogs")

export async function showDeleteProjectMessage(
  projectName: string,
  acceptId: number,
  cancelId: number
): Promise<Electron.MessageBoxReturnValue> {
  const buttons = [t("buttons.accept"), t("buttons.cancel")]
  const options: Electron.MessageBoxOptions = {
    title: t("delete.project.title"),
    message: t("delete.project.message", { projectName }),
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    cancelId: cancelId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}

export async function showDeleteParticipantMessage(
  participantName: string,
  participantCode: string,
  projectName: string,
  acceptId: number,
  cancelId: number
): Promise<Electron.MessageBoxReturnValue> {
  const buttons = [t("buttons.accept"), t("buttons.cancel")]
  const options: Electron.MessageBoxOptions = {
    title: t("delete.participant.title"),
    message: t("delete.participant.message", {
      participantName,
      participantCode,
      projectName
    }),
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    cancelId: cancelId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}

export async function showDeleteProtocolMessage(
  protocolName: string,
  projectName: string,
  acceptId: number,
  cancelId: number
): Promise<Electron.MessageBoxReturnValue> {
  const buttons = [t("buttons.accept"), t("buttons.cancel")]
  const options: Electron.MessageBoxOptions = {
    title: t("delete.protocol.title"),
    message: t("delete.protocol.message", { protocolName, projectName }),
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    cancelId: cancelId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}

export function showSelectProjectErrorMessage(): void {
  window.core.dialog.showErrorBox(
    t("errors.selectProject.title"),
    t("errors.selectProject.description")
  )
}

export function showParticipantCodeErrorMessage(): void {
  window.core.dialog.showErrorBox(
    t("errors.participantCode.title"),
    t("errors.participantCode.description")
  )
}
