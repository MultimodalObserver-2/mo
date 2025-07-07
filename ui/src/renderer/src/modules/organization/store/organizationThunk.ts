import { setSelectedProject } from "./projectsSlice"
import { setSelectedParticipant, clearSelectedParticipant } from "./participantsSlice"
import { Project } from "../types/Project"
import participantService from "../services/ParticipantService"
import { createAsyncThunk } from "@reduxjs/toolkit"
import protocolService from "../services/ProtocolService"
import { clearSelectedProtocol, setSelectedProtocol } from "./protocolsSlice"

export const selectProjectThunk = createAsyncThunk(
  "organization/selectProject",
  async (project: Project, { dispatch }) => {
    dispatch(setSelectedProject(project))

    const savedParticipantUuid = await window.organization.preferences.state.getParticipant()

    if (savedParticipantUuid) {
      const response = await participantService.getByUuid(project.name, savedParticipantUuid)
      dispatch(setSelectedParticipant(response.data))
    } else {
      dispatch(clearSelectedParticipant())
    }

    const savedProtocolUuid = await window.organization.preferences.state.getProtocol()
    if (savedProtocolUuid) {
      const response = await protocolService.getByUuid(project.name, savedProtocolUuid)
      dispatch(setSelectedProtocol(response.data))
    } else {
      dispatch(clearSelectedProtocol())
    }
  }
)
