import projectsReducer from "./projectsSlice"
import participantsReducer from "./participantsSlice"
import protocolsReducer from "./protocolsSlice"

const organizationReducers = {
  projects: projectsReducer,
  participants: participantsReducer,
  protocols: protocolsReducer
}

export default organizationReducers
