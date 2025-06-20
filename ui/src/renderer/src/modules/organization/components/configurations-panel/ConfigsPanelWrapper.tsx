import configProviderRegistry from "../../store/configProviderRegistry"
import ConfigurationsPanel from "./ConfigurationsPanel"

export default function ConfigsPanelWrapper() {
  return <ConfigurationsPanel configProviders={configProviderRegistry.getConfigProviders()} />
}
