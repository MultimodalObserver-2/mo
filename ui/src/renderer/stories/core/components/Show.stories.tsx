import Show from "@renderer/core/components/show/Show"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "storybook/test"
import { useState } from "react"

const meta = {
  title: "Core/Components/Show",
  component: Show,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A utility component for conditional rendering. Renders its children only when the show prop is true."
      }
    }
  },
  argTypes: {
    show: { control: "boolean" },
    children: { control: "text" }
  },
  args: {
    show: true,
    children: "Visible content"
  }
} satisfies Meta<typeof Show>
export default meta
type Story = StoryObj<typeof Show>

export const ShowContent: Story = {}

export const HideContent: Story = {
  args: { show: false, children: "Hidden content" }
}

const ToggleComponent = () => {
  const [show, setShow] = useState(true)
  return (
    <div>
      <button onClick={() => setShow((s) => !s)}>Toggle content</button>
      <Show show={show}>
        <span>Conditional content</span>
      </Show>
    </div>
  )
}

export const Toggle: Story = {
  render: () => <ToggleComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: /toggle content/i })
    await expect(canvas.getByText("Conditional content")).toBeInTheDocument()
    await userEvent.click(button)
    await expect(canvas.queryByText("Conditional content")).not.toBeInTheDocument()
    await userEvent.click(button)
    await expect(canvas.getByText("Conditional content")).toBeInTheDocument()
  }
}
