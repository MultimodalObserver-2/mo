export async function showDeleteCaptureSettingsMessage(
  settingsName: string,
  projectName: string,
  acceptId: number
) {
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Participant",
    message:
      `Are you sure you want to delete the capture source` +
      ` settings ${settingsName} from the project ${projectName}?`,
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}
