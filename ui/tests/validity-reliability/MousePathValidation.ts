import { mouse, straightTo, Button, Point } from "@nut-tree-fork/nut-js"
import fs from "fs"
import path from "path"

export interface MouseValidationResult {
  test: number
  totalClicks: number
  leftClicks: number
  rightClicks: number
  xStart: number
  yStart: number
  xEnd: number
  yEnd: number
  route: Point[]
}

export class MousePathValidation {
  private clicks: { x: number; y: number; button: "left" | "right"; timestamp: number }[] = []
  private route: Point[]

  // Number of left and right clicks for the full path (default: 23 left, 18 right)
  private leftClicksPerPoint = [4, 5, 4, 5, 5] // sum: 23
  private rightClicksPerPoint = [3, 4, 3, 4, 4] // sum: 18

  constructor(route?: Point[]) {
    this.route = route ?? [
      { x: 528, y: 977 },
      { x: 820, y: 545 },
      { x: 820, y: 679 },
      { x: 215, y: 679 },
      { x: 767, y: 789 }
    ]
  }

  async run(): Promise<Omit<MouseValidationResult, "test">> {
    let leftClicks = 0
    let rightClicks = 0
    await mouse.setPosition(this.route[0])
    for (let i = 0; i < this.route.length; i++) {
      const pt = this.route[i]
      if (i > 0) {
        await mouse.move(straightTo(pt))
        await new Promise((res) => setTimeout(res, 200))
      }
      // Multiple left clicks
      for (let l = 0; l < this.leftClicksPerPoint[i]; l++) {
        await mouse.click(Button.LEFT)
        leftClicks++
        this.clicks.push({ x: pt.x, y: pt.y, button: "left", timestamp: Date.now() })
        await new Promise((res) => setTimeout(res, 80))
      }
      // Multiple right clicks
      for (let r = 0; r < this.rightClicksPerPoint[i]; r++) {
        await mouse.click(Button.RIGHT)
        rightClicks++
        this.clicks.push({ x: pt.x, y: pt.y, button: "right", timestamp: Date.now() })
        await new Promise((res) => setTimeout(res, 80))
      }
      await new Promise((res) => setTimeout(res, 150))
    }
    return {
      totalClicks: leftClicks + rightClicks,
      leftClicks,
      rightClicks,
      xStart: this.route[0].x,
      yStart: this.route[0].y,
      xEnd: this.route[this.route.length - 1].x,
      yEnd: this.route[this.route.length - 1].y,
      route: this.route
    }
  }

  static saveResults(
    folder: string,
    baseName: string,
    allResults: MouseValidationResult[],
    allClicks: { test: number; x: number; y: number; button: string; timestamp: number }[]
  ) {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
    const dateStr = new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "")
    // Summary CSV
    const summaryPath = path.join(folder, `${baseName}_summary_${dateStr}.csv`)
    fs.writeFileSync(
      summaryPath,
      "Test n°,totalClicks,leftClicks,rightClicks,xStart,yStart,xEnd,yEnd\n" +
        allResults
          .map(
            (r) =>
              `${r.test},${r.totalClicks},${r.leftClicks},${r.rightClicks},${r.xStart},${r.yStart},${r.xEnd},${r.yEnd}`
          )
          .join("\n")
    )
    // Clicks detail CSV
    const clicksPath = path.join(folder, `${baseName}_clicks_${dateStr}.csv`)
    fs.writeFileSync(
      clicksPath,
      "Test n°,order,x,y,button,timestamp\n" +
        allClicks
          .map((c, i) => `${c.test},${i + 1},${c.x},${c.y},${c.button},${c.timestamp}`)
          .join("\n")
    )
    return { summaryPath, clicksPath }
  }

  getClicks(test: number) {
    // Attach test number to each click
    return this.clicks.map((c) => ({
      test,
      x: c.x,
      y: c.y,
      button: c.button,
      timestamp: c.timestamp
    }))
  }
}
