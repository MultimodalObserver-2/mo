import ShowDuration from "@renderer/modules/capture/components/show-duration/ShowDuration"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const meta: Meta<typeof ShowDuration> = {
  title: "Capture/Components/ShowDuration",
  component: ShowDuration,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays a formatted duration value with a timer icon. Used to show session duration in a consistent visual style."
      }
    }
  },
  argTypes: {
    duration: { control: "number" }
  }
}
export default meta
type Story = StoryObj<typeof ShowDuration>

export const Default: Story = {
  args: {
    duration: 3600
  },
  render: (args) => <ShowDuration {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/01:00:00/)).toBeInTheDocument()
  }
}

export const Short: Story = {
  args: {
    duration: 42
  },
  render: (args) => <ShowDuration {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/0:42/)).toBeInTheDocument()
  }
}

export const Zero: Story = {
  args: {
    duration: 0
  },
  render: (args) => <ShowDuration {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText(/0:00/)).toBeInTheDocument()
  }
}
