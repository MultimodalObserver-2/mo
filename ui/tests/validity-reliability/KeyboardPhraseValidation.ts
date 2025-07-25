import { keyboard } from "@nut-tree-fork/nut-js"
import fs from "fs"
import path from "path"

export interface KeyboardValidationResult {
  test: number
  keystrokes: number
  phrase: string
}

export class KeyboardPhraseValidation {
  private keystrokes: { char: string; timestamp: number }[] = []
  private phrase: string

  constructor(phrase?: string) {
    // 16-word phrase, relevant for multimodal data capture and plugin testing
    this.phrase =
      phrase ??
      "Reliable multimodal data capture ensures every plugin is validated for robust automated integration and performance testing"
  }

  async run(): Promise<Omit<KeyboardValidationResult, "test">> {
    for (const ch of this.phrase) {
      await keyboard.type(ch)
      this.keystrokes.push({ char: ch, timestamp: Date.now() })
      await new Promise((res) => setTimeout(res, 10))
    }
    return {
      keystrokes: this.phrase.length,
      phrase: this.phrase
    }
  }

  static saveResults(
    folder: string,
    baseName: string,
    allResults: KeyboardValidationResult[],
    allKeystrokes: { test: number; order: number; char: string; timestamp: number }[]
  ) {
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
    const dateStr = new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "")
    const summaryPath = path.join(folder, `${baseName}_summary_${dateStr}.csv`)
    fs.writeFileSync(
      summaryPath,
      "Test n°,keystrokes,phrase\n" +
        allResults
          .map((r) => `${r.test},${r.keystrokes},"${r.phrase.replace(/"/g, '""')}"`)
          .join("\n")
    )
    const keystrokesPath = path.join(folder, `${baseName}_keystrokes_${dateStr}.csv`)
    fs.writeFileSync(
      keystrokesPath,
      "Test n°,order,char,timestamp\n" +
        allKeystrokes
          .map((k) => `${k.test},${k.order},"${k.char.replace(/"/g, '""')}",${k.timestamp}`)
          .join("\n")
    )
    return { summaryPath, keystrokesPath }
  }

  getKeystrokes(test: number) {
    return this.keystrokes.map((k, idx) => ({
      test,
      order: idx + 1,
      char: k.char,
      timestamp: k.timestamp
    }))
  }
}
