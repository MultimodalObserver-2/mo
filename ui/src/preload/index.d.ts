import { ElectronAPI } from "@electron-toolkit/preload"
import CoreAPI from "./core/interface"
import OrganizationAPI from "./modules/organization/interface"
import CaptureAPI from "./modules/capture/interface"
import VisualizationAPI from "./modules/visualization/interface"

declare global {
  interface Window {
    electron: ElectronAPI
    core: CoreAPI
    organization: OrganizationAPI
    capture: CaptureAPI
    visualization: VisualizationAPI
  }
}
