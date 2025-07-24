import PluginDisplay from "@renderer/core/components/plugin-display/PluginDisplay"
import PluginDisplayHeader from "@renderer/core/components/plugin-display/PluginDisplayHeader"
import PluginDisplayList from "@renderer/core/components/plugin-display/PluginDisplayList"
import PluginCard from "@renderer/core/components/plugin-display/PluginCard"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, userEvent, within } from "storybook/test"
import { useState } from "react"

const meta: Meta<typeof PluginDisplay> = {
  title: "Core/Components/PluginDisplay",
  component: PluginDisplay,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "light" }
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A stylized wrapper for the native select element with optional label, placeholder and visual variants."
      }
    }
  },
  argTypes: {
    style: { control: "select", options: ["light", "dark"] },
    textSize: { control: "select", options: ["sm", "md"] },
    isExpandable: { control: "boolean" },
    isLoading: { control: "boolean" }
  }
}
export default meta
type Story = StoryObj<typeof PluginDisplay>

const cards = [
  {
    name: "Plugin A",
    version: "1.0.0",
    description: "First demo plugin.",
    iconPath: "",
    isSelected: false
  },
  {
    name: "Plugin B",
    version: "2.1.0",
    description: "Second demo plugin.",
    iconPath: "",
    isSelected: true
  }
]

export const Default: Story = {
  render: (args) => (
    <PluginDisplay {...args}>
      <PluginDisplayHeader title="Plugins" num={2} testid="plugin-header-num" />
      <PluginDisplayList>
        {cards.map((card) => (
          <PluginCard key={card.name} {...card} />
        ))}
      </PluginDisplayList>
    </PluginDisplay>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByTestId("plugin-header-num")).toHaveTextContent("2")
    expect(canvas.getByText("Plugins")).toBeInTheDocument()
    expect(canvas.getByText("Plugin A")).toBeInTheDocument()
    expect(canvas.getByText("Plugin B")).toBeInTheDocument()
  }
}

export const DarkStyle: Story = {
  args: { style: "dark" },
  render: (args) => (
    <PluginDisplay {...args}>
      <PluginDisplayHeader title="Dark Plugins" num={2} testid="plugin-header-num" />
      <PluginDisplayList>
        {cards.map((card) => (
          <PluginCard key={card.name} {...card} />
        ))}
      </PluginDisplayList>
    </PluginDisplay>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText("Dark Plugins")).toBeInTheDocument()
  }
}

export const Loading: Story = {
  args: { isLoading: true },
  render: (args) => (
    <PluginDisplay {...args}>
      <PluginDisplayHeader title="Plugins" num={2} isLoading testid="plugin-header-num" />
      <PluginDisplayList isLoading />
    </PluginDisplay>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByTestId("plugin-header-num").querySelector("div")).toBeInTheDocument()
  }
}

export const EmptyList: Story = {
  render: (args) => (
    <PluginDisplay {...args}>
      <PluginDisplayHeader title="Plugins" num={0} testid="plugin-header-num" />
      <PluginDisplayList />
    </PluginDisplay>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByTestId("plugin-header-num")).toHaveTextContent("0")
  }
}

export const Expandable: Story = {
  args: { isExpandable: true },
  render: (args) => {
    function Wrapper() {
      const [expanded, setExpanded] = useState(true)
      return (
        <PluginDisplay {...args}>
          <PluginDisplayHeader
            title="Expandable Section"
            num={2}
            isExpandable
            isExpanded={expanded}
            onToggleExpand={() => setExpanded((prev) => !prev)}
            testid="plugin-header-num"
          />
          <PluginDisplayList>
            {expanded &&
              cards.map((card) => (
                <PluginCard key={card.name} {...card} />
              ))}
          </PluginDisplayList>
        </PluginDisplay>
      )
    }
    return <Wrapper />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: /collapse section/i })
    expect(button).toBeInTheDocument()
    await userEvent.click(button)
    expect(canvas.queryByText("Plugin A")).not.toBeInTheDocument()
    expect(canvas.queryByText("Plugin B")).not.toBeInTheDocument()
  }
}
