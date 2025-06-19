import { useSelector } from "react-redux"
import { selectConfigProviders } from "../../store/configProvidersSlice"
import ConfigurationsPanel from "./ConfigurationsPanel"

export default function ConfigsPanelWrapper() {
  const configProviders = useSelector(selectConfigProviders)

  return <ConfigurationsPanel configProviders={configProviders} />
}
