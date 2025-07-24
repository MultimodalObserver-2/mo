import Participants from "@renderer/modules/organization/components/participants/Participants"
import type { Meta, StoryObj } from "@storybook/react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import { configureStore, combineReducers } from "@reduxjs/toolkit"
import organizationReducers from "@renderer/modules/organization/store/reducers"
import coreReducers from "@renderer/core/store/reducers"
import { expect, within } from "storybook/test"

// @ts-ignore
window.organization = {
  onChangeSelectedParticipant: () => {
    return () => console.log("Selected participant listener removed")
  },
  onChangeSelectedProject: () => {
    return () => console.log("Selected project listener removed")
  },
  reloadProjects: () => Promise.resolve(),
  onReloadProjects: () => {
    return () => console.log("Reload projects listener removed")
  },
  reloadParticipants: () => () => {},
  onReloadParticipants: () => {
    return () => console.log("Reload participants listener removed")
  }
}

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
      core: {}
    }
  })

const meta: Meta<typeof Participants> = {
  title: "Organization/Components/Participants",
  component: Participants,
  globals: {
    backgrounds: { value: "primary700" }
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Panel to list, add, select, and manage participants for the selected project. Supports edit, delete, lock, and info actions per participant."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof Participants>

function StoryWithProviders({ children }) {
  return (
    <Provider store={createMockStore()}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  )
}

export const Default: Story = {
  render: () => (
    <StoryWithProviders>
      <Participants />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/participants/i)).toBeInTheDocument()
  }
}
