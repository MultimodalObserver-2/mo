import Sidebar from "@renderer/core/components/sidebar/Sidebar"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router"
import store from "@renderer/utils/store"

const meta: Meta<typeof Sidebar> = {
  title: "Core/Layouts/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "light" }
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A static sidebar layout for the main application navigation. Contains links to primary features (projects, plugins) and utilities (settings)."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof Sidebar>

function StoryWithProviders({ children, initialEntries = ["/projects"] }) {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </Provider>
  )
}

export const Default: Story = {
  render: () => (
    <StoryWithProviders>
      <Sidebar />
    </StoryWithProviders>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByTestId("sidebar-main-link")).toBeInTheDocument()
    expect(canvas.getByTestId("sidebar-plugins-link")).toBeInTheDocument()
  }
}
