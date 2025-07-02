import Button from "@renderer/core/components/button/Button"
import AddCircleIcon from "@renderer/core/components/icons/AddCircleIcon"
import {
  Panel,
  PanelElement,
  ElementHeader,
  ElementTitle,
  ElementActions,
  ElementList,
  ElementListItem
} from "@renderer/core/components/panel"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "storybook/test"

const meta = {
  title: "Core/Components/Panel",
  component: Panel,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A set of components for creating structured, styled panels with headers, lists, actions and items."
      }
    }
  },
  argTypes: {
    className: { control: "text" }
  }
} satisfies Meta<typeof Panel>
export default meta
type Story = StoryObj<typeof Panel>

export const Default: Story = {
  render: () => (
    <Panel>
      <PanelElement>
        <ElementHeader>
          <ElementTitle>Users</ElementTitle>
          <ElementActions>
            <AddCircleIcon />
          </ElementActions>
        </ElementHeader>
        <ElementList>
          <ElementListItem label="Alice" />
          <ElementListItem label="Bob" />
        </ElementList>
      </PanelElement>
    </Panel>
  )
}

export const WithActions: Story = {
  render: () => (
    <Panel>
      <PanelElement>
        <ElementHeader>
          <ElementTitle>Teams</ElementTitle>
          <ElementActions>
            <Button styleType="primary-light" style={{ padding: "4px 12px" }}>
              Invite
            </Button>
          </ElementActions>
        </ElementHeader>
        <ElementList>
          <ElementListItem
            label="Research"
            showActions={{ info: true, edit: true, delete: true }}
            onInfo={() => alert("Info clicked")}
            onEdit={() => alert("Edit clicked")}
            onDelete={() => alert("Delete clicked")}
          />
          <ElementListItem
            label="Development"
            showActions={{ info: true, lock: true, delete: true }}
            isLocked={true}
            onInfo={() => alert("Info clicked")}
            onLock={() => alert("Lock clicked")}
            onDelete={() => alert("Delete clicked")}
          />
        </ElementList>
      </PanelElement>
    </Panel>
  )
}

export const Interaction: Story = {
  render: () => (
    <Panel>
      <PanelElement>
        <ElementHeader>
          <ElementTitle>Actions</ElementTitle>
        </ElementHeader>
        <ElementList>
          <ElementListItem
            label="Interactive"
            showActions={{ info: true, edit: true, delete: true }}
            onInfo={() => alert("Info!")}
            onEdit={() => alert("Edit!")}
            onDelete={() => alert("Delete!")}
          />
        </ElementList>
      </PanelElement>
    </Panel>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    window.alert = fn()
    const infoIcon = canvas.getByLabelText("info") || canvas.getByRole("svg", { name: /info/i })
    const editIcon = canvas.getByLabelText("edit") || canvas.getByRole("svg", { name: /edit/i })
    const deleteIcon =
      canvas.getByLabelText("delete") || canvas.getByRole("svg", { name: /delete/i })

    await userEvent.click(infoIcon)
    expect(window.alert).toHaveBeenCalledWith("Info!")
    await userEvent.click(editIcon)
    expect(window.alert).toHaveBeenCalledWith("Edit!")
    await userEvent.click(deleteIcon)
    expect(window.alert).toHaveBeenCalledWith("Delete!")
  }
}
