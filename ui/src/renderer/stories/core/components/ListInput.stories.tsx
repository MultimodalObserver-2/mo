import ListInput from "@renderer/core/components/list-input/ListInput"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "storybook/test"

const meta = {
  title: "Core/Components/ListInput",
  component: ListInput,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A stylized component for a dynamic list of text inputs, supporting add and remove, with label and serialization for forms."
      }
    }
  },
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    boxClassName: { control: "text" },
    className: { control: "text" },
    name: { control: "text" },
    required: { control: "boolean" },
    defaultValue: { control: "object" }
  },
  args: {
    label: "Tags",
    placeholder: "Add a tag...",
    name: "tags",
    required: false,
    defaultValue: [""]
  },
  globals: {
    backgrounds: { value: "primary700" }
  }
} satisfies Meta<typeof ListInput>
export default meta
type Story = StoryObj<typeof ListInput>

export const Default: Story = {}

export const WithInitialValues: Story = {
  args: { defaultValue: ["Science", "AI"] }
}

export const Required: Story = {
  args: { label: "Required List", required: true }
}

export const NoLabel: Story = {
  args: { label: undefined, placeholder: "No label here" }
}

export const Interaction: Story = {
  args: { label: "Skills", placeholder: "Type a skill...", name: "skills", required: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText("Type a skill...")

    await userEvent.type(input, "React")
    await expect(input).toHaveValue("React")

    const addButton = canvas.getByRole("img", { name: /add/i }) // If the icon does not have a role, use querySelector instead
    await userEvent.click(addButton)

    const inputs = canvas.getAllByRole("textbox")
    await expect(inputs.length).toBeGreaterThan(1)

    await userEvent.type(inputs[1], "Node.js")
    await expect(inputs[1]).toHaveValue("Node.js")

    const deleteButtons = canvas.getAllByRole("img", { name: /delete/i })
    await userEvent.click(deleteButtons[0])
    await expect(inputs[0]).not.toHaveValue("React")
  }
}
