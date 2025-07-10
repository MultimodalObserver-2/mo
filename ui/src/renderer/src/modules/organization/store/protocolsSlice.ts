/**
 * @module modules/organization/store/protocolsSlice
 * @description
 * Redux slice for managing the selection state of organization protocols.
 * Provides actions and selectors to set or clear the currently selected protocol,
 * and to access this value from the global Redux store.
 *
 * Used to track which protocol is currently selected in the UI,
 * enabling detail views, editing, or other context-sensitive operations.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Protocol } from "../types/Protocol"
import { RootState } from "@renderer/utils/store"

/**
 * State shape for protocol selection.
 * @property selected - The currently selected protocol, or null if none is selected.
 */
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
    /**
     * Sets the currently selected protocol.
     * @param state - Current slice state.
     * @param action - Payload containing the protocol to select.
     */
    setSelectedProtocol: (state, action: PayloadAction<Protocol>) => {
      state.selected = action.payload
      window.organization.preferences.state.setProtocol(state.selected.uuid)
      window.organization.setProtocol(state.selected.name)
    },
    /**
     * Clears the currently selected protocol (sets to null).
     * @param state - Current slice state.
     */
    clearSelectedProtocol: (state) => {
      state.selected = null
    }
  }
})

export const { setSelectedProtocol, clearSelectedProtocol } = protocolsSlice.actions
/**
 * Selector to access the currently selected protocol from the global Redux state.
 * @param state - Root Redux state.
 * @returns The selected protocol, or null.
 */
export const selectSelectedProtocol = (state: RootState) => state.organization.protocols.selected

const protocolsReducer = protocolsSlice.reducer
export default protocolsReducer
