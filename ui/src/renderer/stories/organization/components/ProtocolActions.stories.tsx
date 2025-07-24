import ProtocolActions from "@renderer/modules/organization/components/protocol-actions/ProtocolActions"
import type { Meta, StoryObj } from "@storybook/react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import { configureStore, combineReducers } from "@reduxjs/toolkit"
import organizationReducers from "@renderer/modules/organization/store/reducers"
import coreReducers from "@renderer/core/store/reducers"
import { expect, userEvent, within } from "storybook/test"

// @ts-ignore
window.organization = {
  getProtocolExecutionStatus: async () => ({
    isRunning: false,
    projectName: null,
    protocolName: null
  }),
  onExecProtocolStarted: () => () => {},
  onExecProtocolFinished: () => () => {},
  stopProtocolExecution: () => {},
  execProtocol: () => {}
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

const mockProtocol = {
  uuid: "protocol-uuid",
  name: "Protocol X",
  locked: false,
  activities: [],
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
        protocols: { selected: mockProtocol }
      },
      core: {}
    }
  })

const meta: Meta<typeof ProtocolActions> = {
  title: "Organization/Components/ProtocolActions",
  component: ProtocolActions,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Panel action to start or stop the protocol execution for the selected project and protocol. Button label and enabled state reflect the execution state."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof ProtocolActions>

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
      <ProtocolActions />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const startButton = canvas.getByRole("button")
    expect(startButton).toBeEnabled()
    expect(canvas.getByText(/START PROTOCOL/i)).toBeInTheDocument()
    await userEvent.click(startButton)
  }
}
