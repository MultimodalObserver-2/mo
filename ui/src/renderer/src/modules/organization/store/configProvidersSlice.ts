import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { ConfigProvider } from "../components/configurations-panel/ConfigurationsPanel"
import { RootState } from "@renderer/store"

export interface ConfigProviderState {
  id: string
  order?: number
  configProvider: ConfigProvider
}

export interface ConfigProvidersState {
  providers: ConfigProviderState[]
}

const initialState: ConfigProvidersState = {
  providers: []
}

const configProvidersSlice = createSlice({
  name: "organization",
  initialState,
  reducers: {
    registerConfigProvider: (state, action: PayloadAction<ConfigProviderState>) => {
      const newProvider = action.payload as ConfigProviderState
      const filtered = state.providers.filter((provider) => provider.id !== newProvider.id)
      state.providers = [...filtered, newProvider].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    },
    unregisterConfigProvider: (state, action: PayloadAction<string>) => {
      state.providers = state.providers.filter((provider) => provider.id !== action.payload)
    },
    registerConfigProviders: (state, action: PayloadAction<ConfigProviderState[]>) => {
      action.payload.forEach((provider) => {
        const newProvider = provider as ConfigProviderState
        const filtered = state.providers.filter(
          (existingProvider) => existingProvider.id !== newProvider.id
        )
        state.providers = [...filtered, newProvider].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      })
    }
  }
})

export const { registerConfigProvider, unregisterConfigProvider, registerConfigProviders } =
  configProvidersSlice.actions

export const selectConfigProviders = (state: RootState) =>
  state.organization.configProviders.providers.map((provider) => provider.configProvider)

const configProvidersReducer = configProvidersSlice.reducer
export default configProvidersReducer
