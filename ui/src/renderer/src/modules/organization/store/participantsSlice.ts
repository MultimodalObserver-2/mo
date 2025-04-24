import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@renderer/core/store/store"
import { Participant } from "../types/Participant"

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
    setSelectedParticipant: (state, action: PayloadAction<Participant>) => {
      state.selected = action.payload
    },
    clearSelectedParticipant: (state) => {
      state.selected = null
    }
  }
})

export const { setSelectedParticipant, clearSelectedParticipant } = participantsSlice.actions
export const selectSelectedParticipant = (state: RootState) =>
  state.organization.participants.selected

const participantsReducer = participantsSlice.reducer
export default participantsReducer
