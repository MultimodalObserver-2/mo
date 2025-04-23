import { configureStore } from "@reduxjs/toolkit"
import organizationReducer from "@renderer/modules/organization/store/organizationSlice"

const store = configureStore({
  reducer: {
    organization: organizationReducer
  }
})

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
