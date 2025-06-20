import projectsReducer from "./projectsSlice"
import participantsReducer from "./participantsSlice"
import protocolsReducer from "./protocolsSlice"
import configProvidersReducer from "./configProviderRegistry"

const organizationReducers = {
  projects: projectsReducer,
  participants: participantsReducer,
  protocols: protocolsReducer,
  configProviders: configProvidersReducer
}

export default organizationReducers
