import Button from "@renderer/core/components/button/Button"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "storybook/test"

const meta: Meta<typeof Button> = {
  title: "Core/Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A reusable button component with customizable style and shape. Accepts all native button props."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    styleType: {
      control: "select",
      options: ["default", "danger", "soft", "extra-soft", "primary-light"]
    },
    borderRadius: {
      control: "select",
      options: ["sm", "md", "xl"]
    },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" },
    children: { control: "text" }
  },
  args: {
    children: "Click me",
    styleType: "default",
    borderRadius: "sm",
    isLoading: false,
    disabled: false
  },
  globals: {
    backgrounds: { value: "primary700" }
  }
} satisfies Meta<typeof Button>
export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: /Click me/i })
    await expect(button).toBeEnabled()
    await userEvent.click(button)
    await expect(button).toBeEnabled()
  }
}

export const Danger: Story = {
  args: {
    styleType: "danger",
    children: "Delete"
  }
}

export const Soft: Story = {
  args: {
    styleType: "soft",
    children: "Soft Button"
  }
}

export const ExtraSoft: Story = {
  args: {
    styleType: "extra-soft",
    children: "Extra Soft Button"
  }
}

export const PrimaryLight: Story = {
  args: {
    styleType: "primary-light",
    children: "Primary Light Button"
  }
}

export const Loading: Story = {
  args: {
    isLoading: true,
    children: "Loading..."
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: /Loading.../i })
    await expect(button).toBeDisabled()
    await userEvent.click(button)
    await expect(button).toBeDisabled()
  }
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button"
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: /Disabled Button/i })
    await expect(button).toBeDisabled()
    await userEvent.click(button)
    await expect(button).toBeDisabled()
  }
}
