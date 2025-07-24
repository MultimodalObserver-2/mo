import { Suspense } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import ErrorElement from "@renderer/core/components/error-element/ErrorElement"
import { expect, within } from "storybook/test"
import { Await } from "react-router"

function RejectingPromise(error: string | Error): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(error), 10)
  })
}

const meta: Meta<typeof ErrorElement> = {
  title: "Core/Components/ErrorElement",
  component: ErrorElement,
  tags: ["autodocs"],
  argTypes: {
    name: { control: "text" }
  }
}
export default meta
type Story = StoryObj<typeof ErrorElement>

export const WithErrorMessage: Story = {
  args: { name: "Test Panel" },
  render: (args) => (
    <Suspense fallback={null}>
      <Await
        resolve={RejectingPromise(new Error("Something went wrong!"))}
        errorElement={<ErrorElement name={args.name} />}
      >
        <div> --- IGNORE --- </div>
      </Await>
    </Suspense>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const errorElement = await canvas.findByTestId("error-element")
    expect(errorElement).toHaveTextContent("componentError: Something went wrong!")
  }
}

export const UnknownError: Story = {
  args: { name: "Route X" },
  render: (args) => (
    <Suspense fallback={null}>
      <Await
        resolve={RejectingPromise("some unknown error")}
        errorElement={<ErrorElement name={args.name} />}
      >
        <div> --- IGNORE --- </div>
      </Await>
    </Suspense>
  ),
  play: async ({ canvasElement }) => {
    const errorElement = await within(canvasElement).findByTestId("error-element")
    expect(errorElement).toHaveTextContent("unknownError")
  }
}
