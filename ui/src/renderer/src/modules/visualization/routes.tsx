import { Route } from "react-router"
import SelectPlaybackView from "./pages/select-playback-view/SelectPlaybackView"
import AddPlaybackConfig from "./pages/add-playback-config/AddPlaybackConfig"
import UpdatePlaybackConfig from "./pages/update-playback-config/UpdatePlaybackConfig"
import StartPlayback from "./pages/start-playback/StartPlayback"
import Playback from "./pages/playback/Playback"

export const VisualizationRoutes = (
  <>
    <Route path="select-playback-view/:projectName" element={<SelectPlaybackView />} />
    <Route path=":projectName/playback-views/:pluginId" element={<AddPlaybackConfig />} />
    <Route path=":projectName/playback-configs/:configName" element={<UpdatePlaybackConfig />} />
    <Route
      path=":projectName/participants/:participantCode/sessions/:sessionId/start-playback"
      element={<StartPlayback />}
    />
  </>
)

export const AppLayoutVisualizationRoutes = (
  <>
    <Route path="sessions/playback" element={<Playback />} />
  </>
)
