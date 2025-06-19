import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "@renderer/store"
import { ReactNode } from "react"

export interface PanelItem {
  id: string
  order?: number
  render: () => ReactNode
}

export interface PanelRegistryState {
  items: PanelItem[]
}

const initialState: PanelRegistryState = {
  items: []
}

const panelRegistrySlice = createSlice({
  name: "core",
  initialState,
  reducers: {
    registerPanelItem: (state, action: PayloadAction<PanelItem>) => {
      const filtered = state.items.filter((item) => item.id !== action.payload.id)
      state.items = [...filtered, action.payload].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    },
    unregisterPanelItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
    },
    registerPanelItems: (state, action: PayloadAction<PanelItem[]>) => {
      action.payload.forEach((item) => {
        const filtered = state.items.filter((existingItem) => existingItem.id !== item.id)
        state.items = [...filtered, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      })
    }
  }
})

export const { registerPanelItem, unregisterPanelItem, registerPanelItems } = panelRegistrySlice.actions
export const selectPanelItems = (state: RootState) => state.core.panelRegistry.items

const panelRegistryReducer = panelRegistrySlice.reducer
export default panelRegistryReducer
