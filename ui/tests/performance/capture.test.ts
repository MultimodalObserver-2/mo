import test, { _electron as electron, ElectronApplication, expect, Page } from "@playwright/test"
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers"
import { NamedProcessMonitor } from "./ProcessMonitor"
import { MouseSimulator } from "./MouseSimulator"
import { KeyboardSimulator } from "./KeyboardSimulator"
import * as fs from "fs"
import * as path from "path"

/**
 * Helper to get environment variable or default value.
 */
function getArg(name: string, defaultValue: number): number {
  if (process.env[name.toUpperCase()]) {
    const val = Number(process.env[name.toUpperCase()])
    if (!isNaN(val)) return val
  }
  return defaultValue
}

/**
 * Helper to get a timestamp string for file names (YYYY-MM-DD_HH-mm-ss)
 */
function getTimestamp(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, "0")
  return (
    now.getFullYear() +
    "-" +
    pad(now.getMonth() + 1) +
    "-" +
    pad(now.getDate()) +
    "_" +
    pad(now.getHours()) +
    "-" +
    pad(now.getMinutes()) +
    "-" +
    pad(now.getSeconds())
  )
}

// Capture duration in milliseconds
const CAPTURE_DURATION_MS = getArg("CAPTURE_DURATION", 60_000)
// Number of test iterations
const ITERATIONS = getArg("ITERATIONS", 10)

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  // Build and launch Electron app for end-to-end testing
  const latestBuild = findLatestBuild("dist")
  const appInfo = parseElectronApp(latestBuild)
  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable
  })
  // Add global error and console listeners to every Electron window
  electronApp.on("window", async (page) => {
    page.on("pageerror", (error) => console.error(error))
    page.on("console", (msg) => console.log(msg.text()))
  })
})

test.afterAll(async () => {
  // Ensure app closes after testing
  if (electronApp) await electronApp.close()
})

test("capture performance test with user activity simulation", async () => {
  // Increase test timeout according to total capture time and setup overhead
  test.setTimeout(CAPTURE_DURATION_MS * ITERATIONS * 1.5 + 80_000)

  // Access the main Electron window
  page = await electronApp.firstWindow()
  // Navigate to plugins view and validate that plugins are loaded
  await page.waitForSelector("[data-testid='sidebar-plugins-link']", { timeout: 10000 })
  await page.click('[data-testid="sidebar-plugins-link"]')
  await page.waitForSelector("[data-testid='capture-plugins-number']", { timeout: 10000 })
  const pluginCount = await page.textContent("[data-testid='capture-plugins-number']")
  expect(Number(pluginCount)).toBeGreaterThan(0)
  await page.waitForTimeout(500)
  // Navigate back to main view
  await page.click('[data-testid="sidebar-main-link"]')
  await page.waitForTimeout(500)

  // Output directory for performance reports
  const outdir = path.join("performance-report", "capture")
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true })

  // Prepare lists for samples and averages
  type SampleRow = { test: number; timestamp: number; cpu: number; memPct: number; memMB: number }
  type AvgRow = { test: string; avgCpu: number; avgMemPct: number; avgMemMB: number }
  const allSamples: SampleRow[] = []
  const allAvgs: AvgRow[] = []

  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`------ RUN ${i + 1} of ${ITERATIONS} ------`)
    // Initialize monitors and simulators for each run
    const monitor = new NamedProcessMonitor("multimodal-observer, mo_api", 1000)
    await monitor.init()
    const mouseSimulator = new MouseSimulator()
    const keyboardSimulator = new KeyboardSimulator()

    // Start user activity and resource monitoring in parallel with capture
    await page.click('[data-testid="capture-toggle-button"]')
    await page.waitForSelector("[data-testid='capture-stop-icon']", { timeout: 30000 })
    monitor.start()
    mouseSimulator.start()
    keyboardSimulator.start()

    // Wait for capture to finish
    await page.waitForTimeout(CAPTURE_DURATION_MS)

    // Stop everything and collect stats
    await page.click('[data-testid="capture-toggle-button"]')
    await page.waitForSelector("[data-testid='capture-play-icon']", { timeout: 30000 })
    monitor.stop()
    mouseSimulator.stop()
    keyboardSimulator.stop()

    // Append each sample with iteration info
    for (const s of monitor.getStats()) {
      allSamples.push({
        test: i + 1,
        timestamp: s.timestamp,
        cpu: s.cpu,
        memPct: s.memoryPct,
        memMB: s.memoryMB
      })
    }

    // Save averages per iteration
    const avgs = monitor.getAverages()
    allAvgs.push({
      test: `Test ${i + 1}`,
      avgCpu: avgs.avgCpu,
      avgMemPct: avgs.avgMemPct,
      avgMemMB: avgs.avgMemMB
    })

    console.log(
      `Iteration ${i + 1}: CPU Avg=${avgs.avgCpu.toFixed(2)}% | Mem Avg=${avgs.avgMemMB.toFixed(2)}MB`
    )
    await page.waitForTimeout(1000)
  }

  // Calculate the global average (for the averages CSV)
  const avgFinal = {
    test: "Average",
    avgCpu: allAvgs.reduce((s, a) => s + a.avgCpu, 0) / allAvgs.length,
    avgMemPct: allAvgs.reduce((s, a) => s + a.avgMemPct, 0) / allAvgs.length,
    avgMemMB: allAvgs.reduce((s, a) => s + a.avgMemMB, 0) / allAvgs.length
  }
  allAvgs.push(avgFinal)

  // Prepare timestamped filenames
  const dateStr = getTimestamp()
  const samplesPath = path.join(outdir, `capture_samples_${dateStr}.csv`)
  const avgsPath = path.join(outdir, `capture_averages_${dateStr}.csv`)

  // Write all samples to one CSV
  fs.writeFileSync(
    samplesPath,
    "Test n°,timestamp,cpu_percent,mem_percent,mem_mb\n" +
      allSamples.map((r) => `${r.test},${r.timestamp},${r.cpu},${r.memPct},${r.memMB}`).join("\n")
  )

  // Write all averages to one CSV
  fs.writeFileSync(
    avgsPath,
    "Test n°,avg_cpu_percent,avg_mem_percent,avg_mem_mb\n" +
      allAvgs.map((r) => `${r.test},${r.avgCpu},${r.avgMemPct},${r.avgMemMB}`).join("\n")
  )

  console.log("--- ALL ITERATIONS COMPLETE ---")
  console.log(`Samples CSV: ${samplesPath}`)
  console.log(`Averages CSV: ${avgsPath}`)
  console.log(`Final CPU Avg: ${avgFinal.avgCpu.toFixed(2)}%`)
  console.log(`Final Mem Avg: ${avgFinal.avgMemMB.toFixed(2)}MB`)
})
