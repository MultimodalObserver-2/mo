import { keyboard, Key } from "@nut-tree-fork/nut-js"

export class KeyboardSimulator {
  private running = false
  private textLines: string[]
  private intervalMs: number

  constructor(textLines?: string[], intervalMs = 500) {
    this.textLines = textLines ?? [
      "Testing multimodal data capture plugin.",
      "Simulating mouse and keyboard input for QA.",
      "Running automated tests for data streams.",
      "Verifying plugin reliability for complex events.",
      "Automated user simulation for multimodal capture.",
      "Evaluating performance under input load.",
      "All events are being detected and recorded."
    ]
    this.intervalMs = intervalMs
  }

  async start() {
    if (this.running) return
    this.running = true
    let idx = 0
    while (this.running) {
      const line = this.textLines[idx % this.textLines.length]
      await keyboard.type(line)
      await keyboard.type(Key.Enter)
      idx++
      await new Promise((res) => setTimeout(res, this.intervalMs))
    }
  }

  stop() {
    this.running = false
  }
}
