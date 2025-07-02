import DisplayData from "@renderer/core/components/display-data/DisplayData"
import type { Meta, StoryObj } from "@storybook/react"
import { within, expect } from "storybook/test"

const meta = {
  title: "Core/Components/DisplayData",
  component: DisplayData,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A flexible component for displaying a labeled data point. Supports string, number, arrays and children, with vertical or horizontal layout."
      }
    }
  },
  argTypes: {
    name: { control: "text" },
    value: { control: "object" },
    childrenClass: { control: "text" },
    boxStyle: {
      control: "select",
      options: ["vertical", "horizontal"]
    },
    children: { control: false }
  },
  args: {
    name: "Project Name",
    value: "Alpha",
    boxStyle: "vertical"
  },
  globals: {
    backgrounds: { value: "primary700" }
  }
} satisfies Meta<typeof DisplayData>
export default meta
type Story = StoryObj<typeof DisplayData>

export const Default: Story = {
  args: { name: "Project", value: "Research 2024" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(args.name)).toBeInTheDocument()
    await expect(canvas.getByText(args.value as string)).toBeInTheDocument()
  }
}

export const NumberValue: Story = {
  args: { name: "Score", value: 93 },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(args.name)).toBeInTheDocument()
    await expect(canvas.getByText(String(args.value))).toBeInTheDocument()
  }
}

export const ArrayValue: Story = {
  args: { name: "Tags", value: ["Neuro", "AI", "UX"] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole("list")).toBeInTheDocument()
    await expect(canvas.getByText("AI")).toBeInTheDocument()
  }
}

export const Horizontal: Story = {
  args: {
    name: "Status",
    value: "Active",
    boxStyle: "horizontal"
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Active")).toBeInTheDocument()
  }
}
