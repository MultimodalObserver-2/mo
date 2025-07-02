import Button from "@renderer/core/components/button/Button"
import ControlsPanelElement from "@renderer/core/components/controls-panel-element/ControlsPanelElement"
import panelControlsRegistry from "@renderer/core/store/panelControlsRegistry"
import type { Meta, StoryObj } from "@storybook/react"
import { userEvent, within, expect, spyOn } from "storybook/test"

const meta = {
  title: "Core/Components/ControlsPanelElement",
  component: ControlsPanelElement,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Renders the list of controls registered in the global panelControlsRegistry. Useful to preview custom control plugins or app features."
      }
    }
  },
  globals: {
    backgrounds: { value: "primary800" }
  }
} satisfies Meta<typeof ControlsPanelElement>
export default meta
type Story = StoryObj<typeof ControlsPanelElement>

function MockControl({
  label = "Sample Control",
  styleType = "default",
  onClick
}: {
  label?: string
  styleType?: "default" | "danger" | "soft" | "extra-soft" | "primary-light"
  onClick?: () => void
}) {
  return (
    <li style={{ display: "flex", padding: "6px 8px", width: "100%" }}>
      <Button
        onClick={onClick}
        styleType={styleType}
        style={{
          width: "100%",
          fontSize: "0.9em",
          fontWeight: "700",
          padding: "5px 10px"
        }}
      >
        {label}
      </Button>
    </li>
  )
}

export const WithControls: Story = {
  render: () => {
    panelControlsRegistry.clearAll()

    panelControlsRegistry.register({
      id: "btn-1",
      render: () => <MockControl label="Action One" onClick={() => alert("Action One!")} />
    })
    panelControlsRegistry.register({
      id: "btn-2",
      render: () => (
        <MockControl
          label="Action Two"
          styleType="primary-light"
          onClick={() => alert("Action Two!")}
        />
      )
    })

    return <ControlsPanelElement />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alertMock = spyOn(window, "alert").mockImplementation(() => {})

    const btn1 = canvas.getByRole("button", { name: /Action One/i })
    const btn2 = canvas.getByRole("button", { name: /Action Two/i })

    await expect(btn1).toBeInTheDocument()
    await expect(btn2).toBeInTheDocument()

    await userEvent.click(btn1)
    await userEvent.click(btn2)

    expect(alertMock).toHaveBeenCalledWith("Action One!")
    expect(alertMock).toHaveBeenCalledWith("Action Two!")
    expect(alertMock).toHaveBeenCalledTimes(2)

    alertMock.mockRestore()
  }
}
