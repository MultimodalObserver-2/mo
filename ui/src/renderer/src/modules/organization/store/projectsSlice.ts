/**
 * @module modules/organization/store/projectsSlice
 * @description
 * Redux slice for managing the selection state of organization projects.
 * Provides actions and selectors to set or clear the currently selected project,
 * and to access this value from the global Redux store.
 *
 * Used to track which project is currently selected in the UI,
 * enabling context-sensitive actions or detail views.
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { Project } from "../types/Project"
import { RootState } from "@renderer/utils/store"

/**
 * State shape for project selection.
 * @property selected - The currently selected project, or null if none is selected.
 */
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
    /**
     * Sets the currently selected project.
     * @param state - Current slice state.
     * @param action - Payload containing the project to select.
     */
    setSelectedProject: (state, action: PayloadAction<Project>) => {
      state.selected = action.payload
      window.organization.preferences.state.setProject(state.selected.uuid)
      window.organization.setProject(state.selected.name)
    },
    /**
     * Clears the currently selected project (sets to null).
     * @param state - Current slice state.
     */
    clearSelectedProject: (state) => {
      state.selected = null
      window.organization.preferences.state.setProject(null)
    }
  }
})

export const { setSelectedProject, clearSelectedProject } = projectsSlice.actions
/**
 * Selector to access the currently selected project from the global Redux state.
 * @param state - Root Redux state.
 * @returns The selected project, or null.
 */
export const selectSelectedProject = (state: RootState) => state.organization.projects.selected

const projectsReducer = projectsSlice.reducer
export default projectsReducer
