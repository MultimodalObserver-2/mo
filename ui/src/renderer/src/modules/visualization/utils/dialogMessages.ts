export async function showDeletePlaybackConfigMessage(
  configName: string,
  projectName: string,
  acceptId: number
): Promise<{ response: number }> {
  const buttons = ["Accept", "Cancel"]
  const options: Electron.MessageBoxOptions = {
    title: "Delete Playback view Configuration",
    message: `Are you sure you want to delete the playback view configuration ${configName} from the project ${projectName}?`,
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}
