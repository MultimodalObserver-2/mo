/**
 * @module core/store/mainUrlSlice
 * @description
 * Redux slice for managing the main URL of the application.
 * This slice allows setting and retrieving the main URL,
 * which can be used for navigation or as a base path for routing.
 */
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@renderer/utils/store"

export interface MainUrlState {
  mainUrl: string
}

const initialState: MainUrlState = {
  mainUrl: "/"
}

const mainUrlSlice = createSlice({
  name: "mainUrl",
  initialState,
  reducers: {
    setMainUrl(state, action: PayloadAction<string>) {
      state.mainUrl = action.payload
    }
  }
})

export const { setMainUrl } = mainUrlSlice.actions
export const selectMainUrl = (state: RootState) => state.core.mainUrl.mainUrl

const mainUrlReducer = mainUrlSlice.reducer
export default mainUrlReducer
