import CaptureHeader from "@renderer/modules/capture/components/capture-header/CaptureHeader"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

window.capture = {
  onReloadCaptureStatus: (callback) => {
    return () => console.log("Capture status listener removed")
  },
  onChangeCaptureStatusTray: (callback) => {
    return () => console.log("Capture tray status listener removed")
  },
  reloadConfigs: () => {
    console.log("Configs reloaded")
  },
  onReloadConfigs: (callback) => {
    return () => console.log("Reload configs listener removed")
  },
  reloadSessions: () => {
    console.log("Sessions reloaded")
  },
  onReloadSessions: (callback) => {
    return () => console.log("Reload sessions listener removed")
  },
  reloadCaptureStatus: () => {
    console.log("Capture status reloaded")
  }
}


const meta: Meta<typeof CaptureHeader> = {
  title: "Capture/Components/CaptureHeader",
  component: CaptureHeader,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Header for the current capture session, showing camera icon and participant/project info if capture is active. Renders nothing if capture is not running."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof CaptureHeader>

export const Empty: Story = {
  render: () => <CaptureHeader />,
  play: async ({ canvasElement }) => {
    // No debería haber nada
    const canvas = within(canvasElement)
    expect(canvas.queryByText(/participant/i)).toBeNull()
    expect(canvas.queryByRole("img")).toBeNull()
  }
}

export const WithCapture: Story = {
  render: () => (
    <CaptureHeader />
  ),
  play: async ({  }) => {
  }
}
