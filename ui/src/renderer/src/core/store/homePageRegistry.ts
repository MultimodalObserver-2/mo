import { ReactNode } from "react"

export interface HomePageHeader {
  id: string
  priority: number
  render: () => ReactNode
}

export interface HomePageBody {
  id: string
  render: () => ReactNode
}

class HomePageRegistry {
  private body: HomePageBody | null = null
  private headerItems: HomePageHeader[] = []

  setBody(item: HomePageBody): void {
    this.body = item
  }

  getBody(): HomePageBody | null {
    return this.body
  }

  registerHeader(item: HomePageHeader): void {
    const filtered = this.headerItems.filter((i) => i.id !== item.id)
    this.headerItems = [...filtered, item].sort((a, b) => a.priority - b.priority)
  }

  registerManyHeaders(items: HomePageHeader[]): void {
    items.forEach((item) => {
      const filtered = this.headerItems.filter((existing) => existing.id !== item.id)
      this.headerItems = [...filtered, item].sort((a, b) => a.priority - b.priority)
    })
  }

  unregisterHeader(id: string): void {
    this.headerItems = this.headerItems.filter((item) => item.id !== id)
  }

  getHeaders(): HomePageHeader[] {
    return this.headerItems
  }
}

const homePageRegistry = new HomePageRegistry()
export default homePageRegistry
