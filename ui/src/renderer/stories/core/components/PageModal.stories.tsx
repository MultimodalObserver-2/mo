import PageModal from "@renderer/core/components/page-modal/PageModal"
import ModalHeader from "@renderer/core/components/page-modal/modal-header/ModalHeader"
import ModalTitle from "@renderer/core/components/page-modal/modal-header/ModalTitle"
import ModalBody from "@renderer/core/components/page-modal/modal-body/ModalBody"
import ModalFooter from "@renderer/core/components/page-modal/modal-footer/ModalFooter"
import Button from "@renderer/core/components/button/Button"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect, fn } from "storybook/test"
import Input from "@renderer/core/components/input/Input"

const meta = {
  title: "Core/Components/PageModal",
  component: PageModal,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "primary200" }
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A compound component that creates a stylized modal layout. Expects ModalHeader, ModalBody, and ModalFooter as children."
      }
    }
  },
  argTypes: {
    className: { control: "text" }
  }
} satisfies Meta<typeof PageModal>
export default meta
type Story = StoryObj<typeof PageModal>

export const Default: Story = {
  render: () => (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Modal Title" />
      </ModalHeader>
      <ModalBody>
        <p>This is a simple modal body.</p>
      </ModalBody>
      <ModalFooter>
        <Button styleType="primary-light">Accept</Button>
        <Button styleType="soft">Cancel</Button>
      </ModalFooter>
    </PageModal>
  )
}

export const WithFormBody: Story = {
  render: () => (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Form Modal" />
      </ModalHeader>
      <ModalBody
        type="form"
        id="my-form"
        onSubmit={(e) => {
          e.preventDefault()
          alert("Submitted!")
        }}
      >
        <Input type="text" placeholder="Type here..." />
        <Button type="submit" styleType="primary-light">
          Submit
        </Button>
      </ModalBody>
      <ModalFooter>
        <Button styleType="soft">Close</Button>
      </ModalFooter>
    </PageModal>
  )
}

export const Interaction: Story = {
  render: () => (
    <PageModal>
      <ModalHeader>
        <ModalTitle title="Actions" />
      </ModalHeader>
      <ModalBody>
        <div>Click &quot;OK&quot; to trigger an action.</div>
      </ModalBody>
      <ModalFooter>
        <Button onClick={() => alert("OK pressed!")}>OK</Button>
        <Button>Cancel</Button>
      </ModalFooter>
    </PageModal>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const okButton = canvas.getByRole("button", { name: /ok/i })
    window.alert = fn()
    await userEvent.click(okButton)
    expect(window.alert).toHaveBeenCalledWith("OK pressed!")
  }
}
