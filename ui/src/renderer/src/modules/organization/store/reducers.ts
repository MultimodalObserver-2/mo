/**
 * @module modules/organization/store/reducers
 * @description
 * Combines the organization module's Redux reducers into a single object.
 * This object is registered in the root Redux store, grouping all
 * feature-specific state management (projects, participants, protocols)
 * for the organization domain under a single namespace.
 *
 * Each key corresponds to a state slice for a particular feature in the organization module.
 */

import projectsReducer from "./projectsSlice"
import participantsReducer from "./participantsSlice"
import protocolsReducer from "./protocolsSlice"

const organizationReducers = {
  projects: projectsReducer,
  participants: participantsReducer,
  protocols: protocolsReducer
}

export default organizationReducers
