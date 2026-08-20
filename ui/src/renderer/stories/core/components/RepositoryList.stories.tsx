import RepositoryList from "@renderer/core/components/repository-list/RepositoryList"
import { RepositoryPlugin } from "@renderer/core/types/RepositoryPlugin"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const t = (key: string): string => key

const mockPlugins: RepositoryPlugin[] = [
  {
    _id: "1",
    slug: "serial-capture",
    name: "Serial Capture",
    description: "Reads framed data from a serial port.",
    publisher_slug: "mo",
    average_rating: 4.5,
    reviews_count: 12
  },
  {
    _id: "2",
    slug: "video-capture",
    name: "Video Capture",
    description: "Records webcam and screen sources.",
    publisher_slug: "mo",
    average_rating: 4.8,
    reviews_count: 30
  }
]

const meta: Meta<typeof RepositoryList> = {
  title: "Core/Components/RepositoryList",
  component: RepositoryList,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "light" }
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Panel listing the plugins available in the repository. Each card shows the plugin name, description and icon, with a dot when an update is available."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof RepositoryList>

export const Default: Story = {
  render: () => (
    <RepositoryList
      plugins={mockPlugins}
      isLoadingList={false}
      isLoadingMore={false}
      listError={false}
      isSelected={() => false}
      hasUpdate={() => false}
      onSelect={() => {}}
      sentinelRef={null}
      t={t}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText("Serial Capture")).toBeInTheDocument()
  }
}
