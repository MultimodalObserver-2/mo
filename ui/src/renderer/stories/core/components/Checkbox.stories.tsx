import Checkbox from "@renderer/core/components/checkbox/Checkbox"
import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"
import { expect, userEvent, within } from "storybook/test"

const meta = {
  title: "Core/Components/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A component that renders a stylized checkbox input with a label. Accepts all native input props (except type) and custom className."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    children: { control: "text" },
    className: { control: "text" }
  },
  args: {
    children: "Remember me",
    disabled: false
  },
  globals: {
    backgrounds: { value: "primary700" }
  }
} satisfies Meta<typeof Checkbox>
export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox")
    await expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
  }
}

export const Checked: Story = {
  args: { checked: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox")
    await expect(checkbox).toBeChecked()
  }
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox")
    await expect(checkbox).toBeDisabled()
    await userEvent.click(checkbox)
    await expect(checkbox).toBeDisabled()
  }
}

export const WithLabel: Story = {
  args: {
    children: "Accept terms and conditions"
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    canvas.getByText(/Accept terms and conditions/i)
  }
}

const InteractiveComponent = (args: React.ComponentProps<typeof Checkbox>) => {
  const [checked, setChecked] = useState(false)
  return (
    <Checkbox {...args} checked={checked} onChange={() => setChecked((prev) => !prev)}>
      {args.children}
    </Checkbox>
  )
}

export const Interactive: Story = {
  render: (args) => <InteractiveComponent {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox")
    await expect(checkbox).not.toBeChecked()
    await userEvent.click(checkbox)
    await expect(checkbox).toBeChecked()
    await userEvent.click(checkbox)
    await expect(checkbox).not.toBeChecked()
  }
}
