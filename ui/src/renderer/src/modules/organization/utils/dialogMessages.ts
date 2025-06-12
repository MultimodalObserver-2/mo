/**
 * @module dialogMessages
 * This file contains utility functions for displaying native dialogs and
 * message boxes throughout the application. It centralizes the logic for
 * confirmation dialogs (e.g., deletions) and common error messages, using the
 * Electron dialog API exposed at `window.core.dialog`.
 */

export async function showDeleteProjectMessage(
  projectName: string,
  acceptId: number,
  cancelId: number
): Promise<Electron.MessageBoxReturnValue> {
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Project",
    message:
      `Are you sure you want to delete the project ${projectName}?,` +
      " this will delete all the data related to this project",
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
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Participant",
    message:
      `Are you sure you want to delete the participant ${participantName}` +
      ` (code: ${participantCode}) from the project ${projectName}?` +
      `\nThis will delete all data related to this participant`,
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
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Protocol",
    message:
      `Are you sure you want to delete the protocol ${protocolName}` +
      ` from the project ${projectName}?` +
      `\nThis will delete all data related to this protocol`,
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
    "Select Project",
    "You need to select a project to perform this action"
  )
}

export function showParticipantCodeErrorMessage(): void {
  window.core.dialog.showErrorBox("Error", "Participant code error")
}
