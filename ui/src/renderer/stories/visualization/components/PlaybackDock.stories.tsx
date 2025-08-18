import PlaybackDock from "@renderer/modules/visualization/components/playback-dock/PlaybackDock"
import type { Meta, StoryObj } from "@storybook/react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import { configureStore, combineReducers } from "@reduxjs/toolkit"
import organizationReducers from "@renderer/modules/organization/store/reducers"
import coreReducers from "@renderer/core/store/reducers"
import { expect, within } from "storybook/test"
import { IDockviewPanelProps } from "dockview"
import { PlaybackConfig } from "@renderer/modules/visualization/types/PlaybackConfig"

// @ts-ignore
window.visualization = {
  onReloadPlaybackConfigs: () => () => {},
  onUpdatePanelParameters: () => () => {}
}

// @ts-ignore
window.core = {
  app: {
    paths: {
      plugins: () => Promise.resolve("/mock/plugins/path"),
      locales: () => Promise.resolve("/mock/locales/path")
    },
    version: function (): Promise<string> {
      return Promise.resolve("1.0.0")
    }
  }
}

const mockProject = {
  uuid: "test-uuid",
  name: "Mock Project",
  description: "Mock project description",
  location: "Mock location",
  locked: false,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z"
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
      core: {}
    }
  })

const MockPanel = (props: IDockviewPanelProps<PlaybackConfig>) => (
  <div data-testid="mock-playback-panel">Panel: {props.params?.name ?? "No Name"}</div>
)

const meta: Meta<typeof PlaybackDock> = {
  title: "Visualization/Components/PlaybackDock",
  component: PlaybackDock,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Docking layout for visualization playback panels, managing dynamic plugin panels using Dockview."
      }
    }
  },
  argTypes: {
    playbackPanel: { control: false }
  }
}
export default meta
type Story = StoryObj<typeof PlaybackDock>

function StoryWithProviders({ children }) {
  return (
    <Provider store={createMockStore()}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  )
}

export const Default: Story = {
  args: {
    playbackPanel: MockPanel
  },
  render: (args) => (
    <StoryWithProviders>
      <PlaybackDock {...args} />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByRole("presentation")).toBeInTheDocument()
  }
}
