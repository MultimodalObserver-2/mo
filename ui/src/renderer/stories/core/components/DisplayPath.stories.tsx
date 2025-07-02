import DisplayPath from "@renderer/core/components/display-path/DisplayPath"
import type { Meta, StoryObj } from "@storybook/react"
import { within, expect } from "storybook/test"

const meta = {
  title: "Core/Components/DisplayPath",
  component: DisplayPath,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays a file path or URL with action buttons to copy the value or open it in the native file explorer or browser."
      }
    }
  },
  argTypes: {
    name: { control: "text" },
    value: { control: "text" },
    disabled: { control: "boolean" },
    path_type: {
      control: "select",
      options: ["url", "path"]
    },
    className: { control: "text" }
  },
  args: {
    name: "Output Directory",
    value: "/home/user/projects/output",
    path_type: "path",
    disabled: false
  },
  globals: {
    backgrounds: { value: "primary700" }
  }
} satisfies Meta<typeof DisplayPath>
export default meta
type Story = StoryObj<typeof DisplayPath>

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText(args.name)).toBeInTheDocument()
    await expect(canvas.getByText(args.value)).toBeInTheDocument()
    await expect(canvas.getAllByRole("button")).toHaveLength(2)
  }
}

export const URLType: Story = {
  args: {
    name: "Repository",
    value: "https://github.com/mocodigo",
    path_type: "url"
  }
}

export const Disabled: Story = {
  args: {
    disabled: true
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const buttons = canvas.getAllByRole("button")
    for (const btn of buttons) {
      await expect(btn).toBeDisabled()
    }
  }
}
