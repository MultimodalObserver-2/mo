import { ReactNode } from "react"

export interface PanelItem {
  id: string
  order?: number
  render: () => ReactNode
}

class PanelRegistry {
  private items: PanelItem[] = []

  register(item: PanelItem): void {
    const filtered = this.items.filter((i) => i.id !== item.id)
    this.items = [...filtered, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  unregister(id: string): void {
    this.items = this.items.filter((item) => item.id !== id)
  }

  registerMany(items: PanelItem[]): void {
    items.forEach((item) => {
      const filtered = this.items.filter((existing) => existing.id !== item.id)
      this.items = [...filtered, item].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
  }

  getItems(): PanelItem[] {
    return this.items
  }
}

const panelRegistry = new PanelRegistry()
export default panelRegistry
