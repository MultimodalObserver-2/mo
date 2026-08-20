import SearchBar from "@renderer/core/components/search-bar/SearchBar"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const meta: Meta<typeof SearchBar> = {
  title: "Core/Components/SearchBar",
  component: SearchBar,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "light" }
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A free-text search input with a leading magnifier icon. Fully controlled: it holds no state of its own and reports every keystroke to the parent."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof SearchBar>

export const Default: Story = {
  render: () => <SearchBar value="" onChange={() => {}} placeholder="Search plugins…" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByPlaceholderText("Search plugins…")).toBeInTheDocument()
  }
}
