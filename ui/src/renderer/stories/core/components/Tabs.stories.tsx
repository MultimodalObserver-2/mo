import Tabs from "@renderer/core/components/tabs/Tabs"
import Tab from "@renderer/core/components/tabs/Tab"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "storybook/test"

const meta = {
  title: "Core/Components/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A compound component that creates a tabbed interface using Tab children for navigation and content."
      }
    }
  },
  argTypes: {
    children: { control: false }
  }
} satisfies Meta<typeof Tabs>
export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <section style={{ width: "400px", height: "200px" }}>
      <Tabs>
        <Tab title="Tab 1" key="1">
          Content of Tab 1
        </Tab>
        <Tab title="Tab 2" key="2">
          Content of Tab 2
        </Tab>
        <Tab title="Tab 3" key="3">
          Content of Tab 3
        </Tab>
      </Tabs>
    </section>
  )
}

export const TwoTabs: Story = {
  render: () => (
    <Tabs>
      <Tab title="Alpha">Alpha content</Tab>
      <Tab title="Beta">Beta content</Tab>
    </Tabs>
  )
}

export const Interaction: Story = {
  render: () => (
    <section style={{ width: "400px", height: "200px" }}>
      <Tabs>
        <Tab title="Tab 1" key="1">
          Content of Tab 1
        </Tab>
        <Tab title="Tab 2" key="2">
          Content of Tab 2
        </Tab>
        <Tab title="Tab 3" key="3">
          Content of Tab 3
        </Tab>
      </Tabs>
    </section>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Content of Tab 1")).toBeInTheDocument()
    const tab2Button = canvas.getByRole("button", { name: "Tab 2" })
    await userEvent.click(tab2Button)
    await expect(canvas.getByText("Content of Tab 2")).toBeInTheDocument()
    const tab3Button = canvas.getByRole("button", { name: "Tab 3" })
    await userEvent.click(tab3Button)
    await expect(canvas.getByText("Content of Tab 3")).toBeInTheDocument()
  }
}
