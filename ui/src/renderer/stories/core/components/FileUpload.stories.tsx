import FileUpload from "@renderer/core/components/file-upload/FileUpload"
import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "storybook/test"

const meta = {
  title: "Core/Components/FileUpload",
  component: FileUpload,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A file upload component supporting drag-and-drop and Browse, with optional multiple and accepted file types."
      }
    }
  },
  argTypes: {
    id: { control: "text" },
    name: { control: "text" },
    accept: { control: "object" },
    multiple: { control: "boolean" },
    required: { control: "boolean" }
  },
  args: {
    id: "file",
    name: "file",
    accept: [],
    multiple: false,
    required: false
  }
} satisfies Meta<typeof FileUpload>
export default meta
type Story = StoryObj<typeof FileUpload>

export const Default: Story = {}

export const Multiple: Story = {
  args: { multiple: true }
}

export const AcceptedTypes: Story = {
  args: { accept: [".pdf", ".jpg", ".png"] }
}

export const Interaction: Story = {
  args: { multiple: true, accept: [".txt", ".md"] },
  render: (args) => {
    return <FileUpload {...args} onChangeFiles={args.onChangeFiles ?? (() => {})} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas
      .getByLabelText(/browse/i)
      .querySelector("input[type='file']") as HTMLInputElement

    // const file1 = new File(["hello"], "hello.txt", { type: "text/plain" })
    // const file2 = new File(["doc"], "doc.md", { type: "text/markdown" })

    // await userEvent.upload(input, [file1, file2])

    // await expect(canvas.getByText(/hello.txt/)).toBeInTheDocument()
    // await expect(canvas.getByText(/doc.md/)).toBeInTheDocument()
  }
}
