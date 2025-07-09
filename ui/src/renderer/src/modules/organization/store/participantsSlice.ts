/**
 * @module modules/organization/store/participantsSlice
 * @description
 * Redux slice for managing the selection state of organization participants.
 * Provides actions and selectors to set or clear the currently selected participant,
 * and to access this value from the global Redux store.
 *
 * Used to track which participant is currently selected in the UI,
 * enabling details view, editing, or other context-sensitive operations.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@renderer/store"
import { Participant } from "../types/Participant"

/**
 * State shape for participant selection.
 * @property selected - The currently selected participant, or null if none is selected.
 */
export interface ParticipantsState {
  selected: Participant | null
}

const initialState: ParticipantsState = {
  selected: null
}

const participantsSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    /**
     * Sets the currently selected participant.
     * @param state - Current slice state.
     * @param action - Payload containing the participant to select.
     */
    setSelectedParticipant: (state, action: PayloadAction<Participant>) => {
      state.selected = action.payload
      window.organization.preferences.state.setParticipant(state.selected.uuid)
      window.organization.setParticipant(state.selected.code)
    },
    /**
     * Clears the currently selected participant (sets to null).
     * @param state - Current slice state.
     */
    clearSelectedParticipant: (state) => {
      state.selected = null
    }
  }
})

export const { setSelectedParticipant, clearSelectedParticipant } = participantsSlice.actions
/**
 * Selector to access the currently selected participant from the global Redux state.
 * @param state - Root Redux state.
 * @returns The selected participant, or null.
 */
export const selectSelectedParticipant = (state: RootState) =>
  state.organization.participants.selected

const participantsReducer = participantsSlice.reducer
export default participantsReducer
