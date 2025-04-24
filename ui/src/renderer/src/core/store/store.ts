import { combineReducers, configureStore } from "@reduxjs/toolkit"
import organizationReducers from "@renderer/modules/organization/store/reducers"

const store = configureStore({
  reducer: {
    organization: combineReducers(organizationReducers)
  }
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
