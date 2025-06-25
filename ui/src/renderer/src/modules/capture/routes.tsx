import { Route } from "react-router"
import SelectCaptureSource from "./pages/select-capture-source/SelectCaptureSource"
import AddCaptureConfig from "./pages/add-capture-config/AddCaptureConfig"
import UpdateCaptureConfig from "./pages/update-capture-config/UpdateCaptureConfig"
import SessionPage from "./pages/session/Session"

export const CaptureRoutes = (
  <>
    <Route path="select-source/:projectName" element={<SelectCaptureSource />} />
    <Route path=":projectName/sources/:pluginId" element={<AddCaptureConfig />} />
    <Route path=":projectName/configs/:configName" element={<UpdateCaptureConfig />} />
    <Route
      path=":projectName/participants/:participantCode/sessions/:sessionId"
      element={<SessionPage />}
    />
  </>
)
