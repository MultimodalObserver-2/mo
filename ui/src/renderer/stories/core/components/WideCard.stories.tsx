import WideCard from "@renderer/core/components/wide-card/WideCard"
import WideCardIcon from "@renderer/core/components/wide-card/WideCardIcon"
import WideCardHeader from "@renderer/core/components/wide-card/WideCardHeader"
import WideCardDescription from "@renderer/core/components/wide-card/WideCardDescription"
import WideCardActions from "@renderer/core/components/wide-card/WideCardActions"
import Button from "@renderer/core/components/button/Button"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "storybook/test"

const meta = {
  title: "Core/Components/WideCard",
  component: WideCard,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary700" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A compound component for a stylized wide card layout, with icon, header, description and actions."
      }
    }
  },
  argTypes: {
    className: { control: "text" }
  }
} satisfies Meta<typeof WideCard>
export default meta
type Story = StoryObj<typeof WideCard>

export const Default: Story = {
  render: () => (
    <WideCard style={{ backgroundColor: "var(--color-primary-800)" }}>
      <WideCardIcon src="https://placekitten.com/60/60" alt="Kitten" />
      <WideCardHeader>
        <h3>Card Title</h3>
      </WideCardHeader>
      <WideCardActions>
        <Button>View</Button>
      </WideCardActions>
      <WideCardDescription>
        This is a simple wide card component with an image, title, actions and description.
      </WideCardDescription>
    </WideCard>
  )
}

export const WithMultipleActions: Story = {
  render: () => (
    <WideCard style={{ backgroundColor: "var(--color-primary-800)" }}>
      <WideCardIcon src="https://placehold.co/60x60" alt="Sample" />
      <WideCardHeader>
        <h3>Project Alpha</h3>
      </WideCardHeader>
      <WideCardActions>
        <Button styleType="primary-light">Edit</Button>
        <Button styleType="danger">Delete</Button>
      </WideCardActions>
      <WideCardDescription>
        Project Alpha is a platform for intelligent research data collection.
      </WideCardDescription>
    </WideCard>
  )
}

export const Interaction: Story = {
  render: () => (
    <WideCard style={{ backgroundColor: "var(--color-primary-800)" }}>
      <WideCardIcon src="https://placehold.co/60x60/png" alt="Document" />
      <WideCardHeader>
        <h3>Document</h3>
      </WideCardHeader>
      <WideCardActions>
        <Button onClick={() => alert("Details clicked!")}>Details</Button>
      </WideCardActions>
      <WideCardDescription>Click the Details button to see more info.</WideCardDescription>
    </WideCard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole("button", { name: /details/i })
    window.alert = fn()
    await userEvent.click(button)
    expect(window.alert).toHaveBeenCalledWith("Details clicked!")
  }
}
