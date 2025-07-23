import { mouse, straightTo, Button, Point } from "@nut-tree-fork/nut-js"

export class MouseSimulator {
  private running = false
  private path: Point[]
  private clickEvery: number
  private intervalMs: number

  constructor(path?: Point[], intervalMs = 500, clickEvery = 2) {
    this.path = path ?? [
      { x: 400, y: 300 },
      { x: 700, y: 300 },
      { x: 700, y: 500 },
      { x: 400, y: 500 },
      { x: 600, y: 600 }
    ]
    this.intervalMs = intervalMs
    this.clickEvery = clickEvery
  }

  async start() {
    if (this.running) return
    this.running = true
    // Move mouse to the starting position
    mouse.setPosition(this.path[0])
    let idx = 1
    while (this.running) {
      const point = this.path[idx % this.path.length]
      await mouse.move(straightTo(point))
      if (idx % this.clickEvery === 0) {
        await mouse.click(Button.LEFT)
      }
      idx++
      await new Promise((res) => setTimeout(res, this.intervalMs))
    }
  }

  stop() {
    this.running = false
  }
}
