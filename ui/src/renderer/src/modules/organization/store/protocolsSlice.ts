import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Protocol } from "../types/Protocol"
import { RootState } from "@renderer/core/store/store"

export interface ProtocolsState {
  selected: Protocol | null
}

const initialState: ProtocolsState = {
  selected: null
}

const protocolsSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    setSelectedProtocol: (state, action: PayloadAction<Protocol>) => {
      state.selected = action.payload
    },
    clearSelectedProtocol: (state) => {
      state.selected = null
    }
  }
})

export const { setSelectedProtocol, clearSelectedProtocol } = protocolsSlice.actions
export const selectSelectedProtocol = (state: RootState) => state.organization.protocols.selected

const protocolsReducer = protocolsSlice.reducer
export default protocolsReducer
