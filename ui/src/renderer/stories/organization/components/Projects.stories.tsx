import Projects from "@renderer/modules/organization/components/projects/Projects"
import type { Meta, StoryObj } from "@storybook/react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import { configureStore, combineReducers } from "@reduxjs/toolkit"
import organizationReducers from "@renderer/modules/organization/store/reducers"
import coreReducers from "@renderer/core/store/reducers"
import { expect, within } from "storybook/test"

// @ts-ignore
window.organization = {
  onReloadProjects: () => () => {},
  onChangeSelectedProject: () => () => {}
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

const meta: Meta<typeof Projects> = {
  title: "Organization/Components/Projects",
  component: Projects,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Panel for listing, creating, selecting, and managing projects. Each project supports edit, delete, lock, and info actions."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof Projects>

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
      <Projects />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/projects/i)).toBeInTheDocument()
  }
}
