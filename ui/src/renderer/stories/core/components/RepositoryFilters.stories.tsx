import RepositoryFilters from "@renderer/core/components/repository-filters/RepositoryFilters"
import { RepositoryTag } from "@renderer/core/types/RepositoryPlugin"
import type { Meta, StoryObj } from "@storybook/react"
import { expect, within } from "storybook/test"

const t = (key: string): string => key

// Stable reference: `searchTags` is a dependency of the component's debounced effect.
const searchTags = async (): Promise<RepositoryTag[]> => []

const meta: Meta<typeof RepositoryFilters> = {
  title: "Core/Components/RepositoryFilters",
  component: RepositoryFilters,
  tags: ["autodocs"],
  globals: {
    backgrounds: { value: "light" }
  },
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Category select plus tag autocomplete for the repository search. Tag suggestions are looked up through the injected `searchTags`, and the selection is capped at MAX_TAGS_PER_SEARCH."
      }
    }
  }
}
export default meta
type Story = StoryObj<typeof RepositoryFilters>

export const Default: Story = {
  render: () => (
    <RepositoryFilters
      category={undefined}
      onCategoryChange={() => {}}
      selectedTags={[]}
      onTagsChange={() => {}}
      searchTags={searchTags}
      t={t}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(canvas.getByText("allCategories")).toBeInTheDocument()
  }
}
