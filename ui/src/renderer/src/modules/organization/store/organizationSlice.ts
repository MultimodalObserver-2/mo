import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Project } from "../types/Project"
import { RootState } from "@renderer/core/store/store"

export interface OrganizationState {
  projects: {
    selected: Project | null
  }
}

const initialState: OrganizationState = {
  projects: {
    selected: null
  }
}

const organizationSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project>) => {
      state.projects.selected = action.payload
    },
    clearSelectedProject: (state) => {
      state.projects.selected = null
    }
  }
})

export const { setSelectedProject, clearSelectedProject } = organizationSlice.actions
export const selectSelectedProject = (state: RootState) => state.organization.projects.selected

const organizationReducer = organizationSlice.reducer
export default organizationReducer
