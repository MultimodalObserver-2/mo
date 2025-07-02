import PathInput from "@renderer/core/components/path-input/PathInput"
import type { Meta, StoryObj } from "@storybook/react"

const meta = {
  title: "Core/Components/PathInput",
  component: PathInput,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A stylized input component for selecting file paths, with an integrated button to open the native file dialog."
      }
    }
  },
  argTypes: {
    label: { control: "text" },
    boxClassName: { control: "text" },
    className: { control: "text" },
    required: { control: "boolean" },
    disabled: { control: "boolean" },
    value: { control: "text" },
    defaultValue: { control: "text" },
    fileTypes: { control: "object" }
  },
  args: {
    label: "File Path",
    required: false,
    disabled: false,
    defaultValue: "",
    fileTypes: ["txt", "csv"]
  }
} satisfies Meta<typeof PathInput>
export default meta
type Story = StoryObj<typeof PathInput>

export const Default: Story = {}

export const Required: Story = {
  args: { label: "Required Path", required: true }
}

export const Disabled: Story = {
  args: { label: "Disabled Path", disabled: true }
}

export const WithFileTypes: Story = {
  args: { label: "Only Images", fileTypes: ["png", "jpg"] }
}
