import OpenSessionsPlayback from "@renderer/modules/visualization/components/open-sessions-playback/OpenSessionsPlayback"
import type { Meta, StoryObj } from "@storybook/react"
import { Provider } from "react-redux"
import { MemoryRouter, Route, Routes } from "react-router"
import { configureStore, combineReducers } from "@reduxjs/toolkit"
import organizationReducers from "@renderer/modules/organization/store/reducers"
import coreReducers from "@renderer/core/store/reducers"
import { expect, userEvent, within } from "storybook/test"

const mockProject = {
  uuid: "test-uuid",
  name: "Mock Project",
  description: "Mock project description",
  location: "Mock location",
  locked: false,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z"
}

const mockParticipant = {
  uuid: "participant-uuid",
  code: "P1",
  name: "Participant 1",
  email: "participant1@example.com",
  notes: [],
  location: "Mock location",
  locked: false,
  created_at: "2023-01-01T00:00:00Z",
  updated_at: "2023-01-01T00:00:00Z"
}

type ProjectType = {
  uuid: string
  name: string
  description: string
  location: string
  locked: boolean
  created_at: string
  updated_at: string
} | null

type ParticipantType = {
  uuid: string
  code: string
  name: string
  email: string
  notes: any[]
  location: string
  locked: boolean
  created_at: string
  updated_at: string
} | null

function createMockStore({
  project = mockProject,
  participant = mockParticipant,
  url = "/"
}: {
  project?: ProjectType
  participant?: ParticipantType
  url?: string
} = {}) {
  return configureStore({
    reducer: {
      core: combineReducers(coreReducers),
      organization: combineReducers(organizationReducers)
    },
    preloadedState: {
      organization: {
        projects: { selected: project },
        participants: { selected: participant },
        protocols: { selected: null }
      },
      core: {
        mainUrl: { mainUrl: url }
      }
    }
  })
}

const meta: Meta<typeof OpenSessionsPlayback> = {
  title: "Visualization/Components/OpenSessionsPlayback",
  component: OpenSessionsPlayback,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Button to open the session playback page for the selected participant and project, or return to the home page when already on playback."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof OpenSessionsPlayback>

function StoryWithProviders({ children, initialEntries = ["/"], store }) {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    </Provider>
  )
}

export const Default: Story = {
  render: () => (
    <StoryWithProviders store={createMockStore()}>
      <OpenSessionsPlayback />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/PLAYSESSIONS/i)).toBeInTheDocument()
    const button = canvas.getByRole("button")
    expect(button).toBeEnabled()
    await userEvent.click(button)
  }
}

export const DisabledWithoutSelection: Story = {
  render: () => (
    <StoryWithProviders store={createMockStore({ project: null, participant: null })}>
      <OpenSessionsPlayback />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button")
    expect(button).toBeDisabled()
  }
}

export const OnPlaybackPage: Story = {
  render: () => (
    <StoryWithProviders
      store={createMockStore({})}
      initialEntries={["/visualization/sessions/playback"]}
    >
      <OpenSessionsPlayback />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/BACKTOHOME/i)).toBeInTheDocument()
    const button = canvas.getByRole("button")
    expect(button).toBeEnabled()
    await userEvent.click(button)
  }
}
