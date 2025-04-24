import projectsReducer from "./projectsSlice"
import participantsReducer from "./participantsSlice"

const organizationReducers = {
  projects: projectsReducer,
  participants: participantsReducer
}

export default organizationReducers
