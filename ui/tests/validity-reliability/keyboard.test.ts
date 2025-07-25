import test, { _electron as electron, ElectronApplication, expect, Page } from "@playwright/test"
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers"
import { KeyboardPhraseValidation, KeyboardValidationResult } from "./KeyboardPhraseValidation"
import path from "path"

function getArg(name: string, defaultValue: number): number {
  if (process.env[name.toUpperCase()]) {
    const val = Number(process.env[name.toUpperCase()])
    if (!isNaN(val)) return val
  }
  return defaultValue
}

const ITERATIONS = getArg("ITERATIONS", 5)

let electronApp: ElectronApplication
let page: Page

test.beforeAll(async () => {
  const latestBuild = findLatestBuild("dist")
  const appInfo = parseElectronApp(latestBuild)
  electronApp = await electron.launch({
    args: [appInfo.main],
    executablePath: appInfo.executable
  })
  electronApp.on("window", async (page) => {
    page.on("pageerror", (error) => console.error(error))
    page.on("console", (msg) => console.log(msg.text()))
  })
})

test.afterAll(async () => {
  if (electronApp) await electronApp.close()
})

test("keyboard validation - validity/reliability test", async () => {
  test.setTimeout(ITERATIONS * 80_000)
  page = await electronApp.firstWindow()
  await page.waitForSelector("[data-testid='sidebar-plugins-link']", { timeout: 10000 })
  await page.click('[data-testid="sidebar-plugins-link"]')
  await page.waitForSelector("[data-testid='capture-plugins-number']", { timeout: 10000 })
  const pluginCount = await page.textContent("[data-testid='capture-plugins-number']")
  expect(Number(pluginCount)).toBeGreaterThan(0)
  await page.waitForTimeout(500)
  await page.click('[data-testid="sidebar-main-link"]')
  await page.waitForTimeout(500)

  const allResults: KeyboardValidationResult[] = []
  const allKeystrokes: { test: number; order: number; char: string; timestamp: number }[] = []

  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`-- Keyboard Validation Iteration ${i + 1} of ${ITERATIONS} --`)

    // Start the capture
    await page.click('[data-testid="capture-toggle-button"]')
    await page.waitForSelector("[data-testid='capture-stop-icon']", { timeout: 30000 })

    const keyboardValidation = new KeyboardPhraseValidation()
    const res = await keyboardValidation.run()
    allResults.push({ test: i + 1, ...res })
    allKeystrokes.push(...keyboardValidation.getKeystrokes(i + 1))

    // Stop the capture after typing
    await page.click('[data-testid="capture-toggle-button"]')
    await page.waitForSelector("[data-testid='capture-play-icon']", { timeout: 30000 })
    await page.waitForTimeout(1000)
  }

  // Save in test-reports/validity-reliability/keyboard
  const folder = path.join("test-reports", "validity-reliability", "keyboard")
  KeyboardPhraseValidation.saveResults(folder, "keyboard", allResults, allKeystrokes)

  console.log("Keyboard validation finished. Results saved in", folder)
})
