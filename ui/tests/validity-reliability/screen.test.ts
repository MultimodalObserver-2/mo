import { Key, keyboard } from "@nut-tree-fork/nut-js"
import test, { _electron as electron, ElectronApplication, expect, Page } from "@playwright/test"
import { exec } from "child_process"
import { findLatestBuild, parseElectronApp } from "electron-playwright-helpers"
import { promisify } from "util"

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

async function openDirectAccess(programPath: string): Promise<void> {
  const execAsync = promisify(exec)
  try {
    await execAsync(`start "" "${programPath}"`)
    console.log(`Opened URL: ${programPath}`)
  } catch (error) {
    console.error(`Failed to open URL ${programPath}:`, error)
    throw new Error(
      `Could not open URL ${programPath}. Please check if the application is running and the URL is correct.`
    )
  }
}

// Capture duration in milliseconds
const CAPTURE_DURATION_MS = getArg("CAPTURE_DURATION", 30_000)
// Number of test iterations
const ITERATIONS = getArg("ITERATIONS", 4)

const OBS_PATH = "./dist/OBS Studio (64bit).lnk"

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

test("screen test", async () => {
  // Increase test timeout according to total capture time and setup overhead
  test.setTimeout(CAPTURE_DURATION_MS * ITERATIONS * 1.5 + 80_000)

  await openDirectAccess(OBS_PATH)
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

  for (let i = 0; i < ITERATIONS; i++) {
    console.log(`------ RUN ${i + 1} of ${ITERATIONS} ------`)
    // Initialize monitors and simulators for each run

    // Start user activity and resource monitoring in parallel with capture
    await page.click('[data-testid="capture-toggle-button"]')
    await page.waitForSelector("[data-testid='capture-stop-icon']", { timeout: 30000 })
    keyboard.pressKey(Key.LeftControl, Key.LeftShift, Key.O)
    keyboard.releaseKey(Key.LeftControl, Key.LeftShift, Key.O)

    // Wait for capture to finish
    await page.waitForTimeout(CAPTURE_DURATION_MS)
    keyboard.pressKey(Key.LeftControl, Key.LeftShift, Key.O)
    keyboard.releaseKey(Key.LeftControl, Key.LeftShift, Key.O)
    // Stop everything and collect stats
    await page.click('[data-testid="capture-toggle-button"]')
    await page.waitForSelector("[data-testid='capture-play-icon']", { timeout: 30000 })

    await page.waitForTimeout(1000)
  }

  console.log("--- ALL ITERATIONS COMPLETE ---")
})
