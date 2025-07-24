import Sessions from "@renderer/modules/capture/components/sessions/Sessions"
import type { Meta, StoryObj } from "@storybook/react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import store from "@renderer/utils/store"
import { expect, within } from "storybook/test"

const meta: Meta<typeof Sessions> = {
  title: "Capture/Components/Sessions",
  component: Sessions,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary600" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Panel that lists all capture sessions for the selected participant and project, with info and delete actions for each session."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof Sessions>

function StoryWithProviders({ children }) {
  return (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  )
}

export const Default: Story = {
  render: () => (
    <StoryWithProviders>
      <Sessions />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/title/i)).toBeInTheDocument()
  }
}
