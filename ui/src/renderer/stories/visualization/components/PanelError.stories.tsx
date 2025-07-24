import PanelError from "@renderer/modules/visualization/components/panel-error/PanelError"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const meta: Meta<typeof PanelError> = {
  title: "Visualization/Components/PanelError",
  component: PanelError,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Panel error message displayed when a visualization plugin failed to load."
      }
    }
  },
  argTypes: {
    pluginId: { control: "text" }
  }
}
export default meta
type Story = StoryObj<typeof PanelError>

export const Default: Story = {
  args: {
    pluginId: "plugin-123"
  },
  render: (args) => <PanelError {...args} />,
  play: async () => {
  }
}
