export async function showDeleteCaptureConfigMessage(
  configName: string,
  projectName: string,
  acceptId: number
) {
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Participant",
    message:
      `Are you sure you want to delete the capture source` +
      ` configuration ${configName} from the project ${projectName}?`,
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
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Session",
    message:
      `Are you sure you want to delete the session with ID ${sessionId}\n` +
      `from the project ${projectName} and participant ${participantCode}?\n` +
      `This action will remove all associated data.`,
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}
