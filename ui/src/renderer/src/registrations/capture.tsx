import sessionRegistry from "@renderer/modules/capture/store/SessionRegistry"
import sessionPlaybackAction from "@renderer/modules/visualization/components/session-playback-action/sessionPlaybackAction"

export function registerSessionPlaybackAction() {
  sessionRegistry.registerAction(sessionPlaybackAction)
}
