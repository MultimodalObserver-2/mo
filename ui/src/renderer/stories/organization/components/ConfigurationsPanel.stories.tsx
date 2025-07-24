import ConfigurationsPanel from "@renderer/modules/organization/components/configurations-panel/ConfigurationsPanel"
import type { Meta, StoryObj } from "@storybook/react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import { expect, within } from "storybook/test"

import type { ConfigProvider } from "@renderer/modules/organization/components/configurations-panel/ConfigurationsPanel"
import type { Config } from "@renderer/modules/organization/components/configurations-panel/ConfigurationsPanel"
import { combineReducers, configureStore } from "@reduxjs/toolkit"
import coreReducers from "@renderer/core/store/reducers"
import organizationReducers from "@renderer/modules/organization/store/reducers"

const mockConfigProviders: ConfigProvider[] = [
    {
        title: "Plugin Configs",
        fetchConfigs: async (): Promise<Config[]> =>
            new Promise((resolve) =>
                setTimeout(
                    () =>
                        resolve([
                            { name: "Config 1", plugin_id: "plugin1", plugin_is_loaded: true, settings: {} },
                            { name: "Config 2", plugin_id: "plugin2", plugin_is_loaded: false, settings: {} }
                        ] as Config[]),
                    100
                )
            ),
        onReloadConfigs: (cb: () => void) => () => {},
        onAddConfig: () => {},
        onDeleteConfig: async () => {},
        onOpenConfig: () => {}
    },
    {
        title: "Another Config Provider",
        fetchConfigs: async (): Promise<Config[]> =>
            new Promise((resolve) =>
                setTimeout(
                    () =>
                        resolve([
                            { name: "Config 3", plugin_id: "plugin3", plugin_is_loaded: true, settings: {} }
                        ] as Config[]),
                    100
                )
            ),
        onReloadConfigs: (cb: () => void) => () => {},
        onAddConfig: () => {},
        onDeleteConfig: async () => {},
        onOpenConfig: () => {}
    }
]

const mockProject = {
  uuid: "test-uuid",
  name: "Mock Project",
  description: "Mock project description",
  location: "Mock location",
  locked: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

const createMockStore = () =>
  configureStore({
    reducer: {
      core: combineReducers(coreReducers),
      organization: combineReducers(organizationReducers)
    },
    preloadedState: {
      organization: {
        projects: { selected: mockProject },
        participants: { selected: null },
        protocols: { selected: null }
      },
    }
  })


const meta: Meta<typeof ConfigurationsPanel> = {
  title: "Organization/Components/ConfigurationsPanel",
  component: ConfigurationsPanel,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Panel for listing, adding, opening, and deleting plugin configurations for the selected project. Supports multiple config providers (e.g., different plugin types)."
      }
    }
  },
  argTypes: {
    configProviders: { control: false }
  }
}
export default meta
type Story = StoryObj<typeof ConfigurationsPanel>

function StoryWithProviders({ children }) {
  return (
    <Provider store={createMockStore()}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  )
}

export const Default: Story = {
  args: {
    configProviders: mockConfigProviders
  },
  render: (args) => (
    <StoryWithProviders>
      <ConfigurationsPanel {...args} />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText("Plugin Configs")).toBeInTheDocument()
  }
}
