import Input from "@renderer/core/components/input/Input"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "storybook/test"

const meta = {
  title: "Core/Components/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile and stylized wrapper for the native input element, with optional label and full attribute support."
      }
    }
  },
  argTypes: {
    label: { control: "text" },
    boxClassName: { control: "text" },
    className: { control: "text" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    type: { control: "text" }
  },
  args: {
    label: "Username",
    placeholder: "Enter your username",
    required: false,
    disabled: false
  },
  globals: {
    backgrounds: { value: "primary700" }
  }
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const WithLabel: Story = {
  args: { label: "Full Name", placeholder: "Jane Doe" }
}

export const Required: Story = {
  args: { label: "Email", required: true, placeholder: "your@email.com" }
}

export const Disabled: Story = {
  args: { label: "Disabled Field", disabled: true, placeholder: "Can't type here" }
}

export const NoLabel: Story = {
  args: { label: undefined, placeholder: "Only input, no label" }
}

export const Interaction: Story = {
  args: { label: "Interactive", placeholder: "Type here..." },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText("Type here...")
    await expect(input).toBeEnabled()
    await userEvent.type(input, "TestUser")
    await expect(input).toHaveValue("TestUser")
  }
}
