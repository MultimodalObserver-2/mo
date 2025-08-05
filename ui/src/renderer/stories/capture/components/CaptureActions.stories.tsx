import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "storybook/test"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import store from "@renderer/utils/store"
import CaptureActions from "@renderer/modules/capture/components/capture-actions/CaptureActions"

window.capture = {
  onReloadCaptureStatus: () => {
    return () => console.log("Capture status listener removed")
  },
  onChangeCaptureStatusTray: () => {
    return () => console.log("Capture tray status listener removed")
  },
  reloadConfigs: () => {
    console.log("Configs reloaded")
  },
  onReloadConfigs: () => {
    return () => console.log("Reload configs listener removed")
  },
  reloadSessions: () => {
    console.log("Sessions reloaded")
  },
  onReloadSessions: () => {
    return () => console.log("Reload sessions listener removed")
  },
  reloadCaptureStatus: () => {
    console.log("Capture status reloaded")
  }
}

const meta: Meta<typeof CaptureActions> = {
  title: "Capture/Components/CaptureActions",
  component: CaptureActions,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Control actions for starting, stopping, pausing, and resuming a capture session. Button availability depends on the selected project and participant."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof CaptureActions>

function StoryWithProviders({ children }) {
  return (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  )
}

export const ReadyToStart: Story = {
  render: () => (
    <StoryWithProviders>
      <CaptureActions />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const startButton = await canvas.findByTestId("capture-toggle-button")
    expect(startButton).toBeDisabled()
    expect(canvas.getByTestId("capture-play-icon")).toBeInTheDocument()
    await userEvent.click(startButton)
  }
}
