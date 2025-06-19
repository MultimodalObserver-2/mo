import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Project } from "../types/Project"
import { RootState } from "@renderer/store"

export interface ProjectsState {
  selected: Project | null
}

const initialState: ProjectsState = {
  selected: null
}

const projectsSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    setSelectedProject: (state, action: PayloadAction<Project>) => {
      state.selected = action.payload
    },
    clearSelectedProject: (state) => {
      state.selected = null
    }
  }
})

export const { setSelectedProject, clearSelectedProject } = projectsSlice.actions
export const selectSelectedProject = (state: RootState) => state.organization.projects.selected

const projectsReducer = projectsSlice.reducer
export default projectsReducer
