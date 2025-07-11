import i18n from "i18next"

const t = i18n.getFixedT(null, "visualization", "dialogs")

export async function showDeletePlaybackConfigMessage(
  configName: string,
  projectName: string,
  acceptId: number
): Promise<{ response: number }> {
  const buttons = [t("buttons.accept"), t("buttons.cancel")]
  const options: Electron.MessageBoxOptions = {
    title: t("delete.playbackConfig.title"),
    message: t("delete.playbackConfig.message", { configName, projectName }),
    type: "warning",
    buttons: buttons,
    defaultId: acceptId,
    noLink: true
  }

  return await window.core.dialog.showMessageBox(options)
}
