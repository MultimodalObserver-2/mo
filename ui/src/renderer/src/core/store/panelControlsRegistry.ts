import { ReactNode } from "react"

export interface PanelControl {
  id: string
  order?: number
  render: () => ReactNode
}

class PanelControlsRegistry {
  private controls: PanelControl[] = []

  register(control: PanelControl): void {
    const filtered = this.controls.filter((c) => c.id !== control.id)
    this.controls = [...filtered, control].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  unregister(id: string): void {
    this.controls = this.controls.filter((control) => control.id !== id)
  }

  registerMany(controls: PanelControl[]): void {
    controls.forEach((control) => {
      const filtered = this.controls.filter((existing) => existing.id !== control.id)
      this.controls = [...filtered, control].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })
  }

  getControls(): PanelControl[] {
    return this.controls
  }
}

const panelControlsRegistry = new PanelControlsRegistry()
export default panelControlsRegistry
