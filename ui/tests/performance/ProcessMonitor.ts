import si from "systeminformation"
import path from "path"
import fs from "fs"

export interface ProcessSample {
  timestamp: number
  cpu: number // %
  memoryMB: number // MB
  memoryPct: number // %
}

export class NamedProcessMonitor {
  private samples: ProcessSample[] = []
  private running = false
  private intervalId: NodeJS.Timeout | null = null
  private totalMemMB: number = 0

  constructor(
    private processNames: string,
    private intervalMs: number = 1000
  ) {}

  async init() {
    const totalMem = await si.mem()
    this.totalMemMB = totalMem.total / 1024 / 1024
  }

  private async capture() {
    if (!this.running) return
    try {
      const processes = await si.processLoad(this.processNames)
      const cpu = processes.reduce((sum, p) => sum + (p.cpu ?? 0), 0) // CPU usage in percentage
      const memPct = processes.reduce((sum, p) => sum + (p.mem ?? 0), 0) // Memory % de cada proceso
      let memMB = 0
      if (this.totalMemMB > 0) {
        memMB = (memPct * this.totalMemMB) / 100
      }
      this.samples.push({
        timestamp: Date.now(),
        cpu: cpu < 100 ? cpu : 100,
        memoryMB: memMB,
        memoryPct: memPct
      })
    } catch (err) {
      console.error(`Error capturing process stats for ${this.processNames}:`, err)
    }
  }

  start() {
    if (this.running) return
    this.running = true
    this.capture()
    this.intervalId = setInterval(() => {
      this.capture()
    }, this.intervalMs)
  }

  stop() {
    this.running = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  getStats() {
    return this.samples
  }

  getAverages() {
    const len = this.samples.length
    if (len === 0) return { avgCpu: 0, avgMemPct: 0, avgMemMB: 0 }
    const avgCpu = this.samples.reduce((sum, s) => sum + s.cpu, 0) / len
    const avgMemPct = this.samples.reduce((sum, s) => sum + s.memoryPct, 0) / len
    const avgMemMB = this.samples.reduce((sum, s) => sum + s.memoryMB, 0) / len
    return { avgCpu, avgMemPct, avgMemMB }
  }

  saveAllStatsToFile(savePath: string, filename: string) {
    const header = "timestamp,cpu_percent,mem_percent,mem_mb\n"
    const lines = this.samples.map((s) => `${s.timestamp},${s.cpu},${s.memoryPct},${s.memoryMB}`)
    const fullpath = path.join(savePath, filename)
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true })
    }
    fs.writeFileSync(fullpath, header + lines.join("\n"))
  }

  saveAveragesToFile(savePath: string, filename: string) {
    const avg = this.getAverages()
    const header = "avg_cpu_percent,avg_mem_percent,avg_mem_mb\n"
    const line = `${avg.avgCpu},${avg.avgMemPct},${avg.avgMemMB}`
    const fullpath = path.join(savePath, filename)
    if (!fs.existsSync(savePath)) {
      fs.mkdirSync(savePath, { recursive: true })
    }
    fs.writeFileSync(fullpath, header + line)
  }
}
