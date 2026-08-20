import Markdown from "@renderer/core/components/markdown/Markdown"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const sample = [
  "# Serial Capture",
  "",
  "Captures data from **serial** devices with _configurable_ sampling.",
  "",
  "## Requirements",
  "",
  "- [x] A supported USB adapter",
  "- [ ] Read access to the port",
  "",
  "| Platform | Asset |",
  "| --- | --- |",
  "| Windows | `plugin-win.zip` |",
  "",
  "```json",
  '{ "port": "COM3", "baud": 115200 }',
  "```"
].join("\n")

const meta: Meta<typeof Markdown> = {
  title: "Core/Components/Markdown",
  component: Markdown,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "light" }
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Renders untrusted third-party markdown, such as a plugin README, as a read-only document. Raw HTML is never rendered and links and images are stripped."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof Markdown>

export const Default: Story = {
  render: () => <Markdown>{sample}</Markdown>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText("Serial Capture")).toBeInTheDocument()
  }
}
