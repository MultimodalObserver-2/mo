import Select from "@renderer/core/components/select/Select"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "storybook/test"

const meta = {
  title: "Core/Components/Select",
  component: Select,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A stylized wrapper for the native select element with optional label, placeholder and visual variants."
      }
    }
  },
  argTypes: {
    styleType: {
      control: "select",
      options: ["primary", "soft"]
    },
    placeholder: { control: "text" },
    label: { control: "text" },
    boxClassName: { control: "text" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    className: { control: "text" },
    defaultValue: { control: "text" }
  },
  args: {
    label: "Choose a fruit",
    placeholder: "Select one...",
    styleType: "primary",
    required: false,
    disabled: false,
    defaultValue: ""
  }
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof Select>

const options = (
  <>
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="orange">Orange</option>
  </>
)

export const Default: Story = {
  render: (args) => <Select {...args}>{options}</Select>
}

export const WithPlaceholder: Story = {
  args: { placeholder: "Pick a fruit..." },
  render: (args) => <Select {...args}>{options}</Select>
}

export const SoftStyle: Story = {
  args: { styleType: "soft" },
  render: (args) => <Select {...args}>{options}</Select>
}

export const Required: Story = {
  args: { label: "Required field", required: true },
  render: (args) => <Select {...args}>{options}</Select>
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <Select {...args}>{options}</Select>
}

export const Interaction: Story = {
  render: (args) => <Select {...args}>{options}</Select>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const select = canvas.getByRole("combobox")
    await userEvent.selectOptions(select, "banana")
    await expect(select).toHaveValue("banana")
  }
}
