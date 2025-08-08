/**
 * @module core/fs
 * @description Provides functions to interact with the file system, such as reading and writing files, checking existence, and directory operations.
 */

import { ipcMain, app, shell } from "electron"
import fs from "fs"

type Proc = { pid: number; name: string }

app.whenReady().then(() => {
  ipcMain.handle("core:fs:readFileSync", async (_event, filePath: string, encoding = "utf-8") => {
    return fs.readFileSync(filePath, encoding)
  })

  ipcMain.handle("core:fs:writeFileSync", async (_event, filePath: string, content: string) => {
    return fs.writeFileSync(filePath, content, "utf-8")
  })

  ipcMain.handle("core:fs:readdirSync", async (_event, dirPath: string) => {
    return fs.readdirSync(dirPath)
  })

  ipcMain.handle("core:fs:existsSync", async (_event, filePath: string) => {
    return fs.existsSync(filePath)
  })

  ipcMain.handle(
    "core:fs:rmSync",
    async (_event, filePath: string, options?: { recursive?: boolean; force?: boolean }) => {
      return fs.rmSync(filePath, options)
    }
  )

  ipcMain.handle("core:fs:isDirectory", async (_event, filePath: string) => {
    return fs.statSync(filePath).isDirectory()
  })

  ipcMain.handle(
    "core:fs:suggestProcessForFile",
    async (
      _event,
      filePath: string,
      options?: { waitMs?: number; attempts?: number }
    ): Promise<{ processName?: string; pid?: number }> => {
      const waitMs = Math.max(100, options?.waitMs ?? 900)
      const attempts = Math.max(1, options?.attempts ?? 2)

      // Snapshot before opening
      const before = await safePs()

      // Open via default handler; returns empty string on success
      const error = await shell.openPath(filePath)
      if (error) {
        return { processName: undefined, pid: undefined }
      }

      // Give the target app a moment to spawn, then try a couple scans
      let detected: { name?: string; pid?: number } = {}
      for (let i = 0; i < attempts; i++) {
        await delay(waitMs)
        const after = await safePs()
        const cand = pickNewProcess(before, after)
        if (cand) {
          detected = cand
          break
        }
      }

      return { processName: detected.name, pid: detected.pid }
    }
  )
})

/** Sleep helper */
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Returns running processes using ps-list (pid + image name). */
async function safePs(): Promise<Proc[]> {
  try {
    const psList = (await import("ps-list")).default
    const list = await psList()
    return list.map((p) => ({ pid: Number(p.pid), name: String(p.name) }))
  } catch (e) {
    console.error("Failed to list processes:", e)
    return []
  }
}

/**
 * Picks the most likely newly spawned process by:
 * - New PIDs not present "before"
 * - Or increased count of a given name
 * Filters out common launchers (shells/openers).
 */
function pickNewProcess(
  before: Proc[],
  after: Proc[]
): { name?: string; pid?: number } | undefined {
  const beforePids = new Set(before.map((p) => p.pid))
  const afterOnly = after.filter((p) => !beforePids.has(p.pid))

  const bad = new Set(
    [
      "cmd.exe",
      "conhost.exe",
      "powershell.exe",
      "wsl.exe",
      "open",
      "xdg-open",
      "sh",
      "bash",
      "zsh",
      "fish",
      "electron",
      "Electron",
      "smartscreen.exe"
    ].map((s) => s.toLowerCase())
  )

  const clean = afterOnly.filter((p) => !bad.has(p.name.toLowerCase()))
  if (clean.length > 0) {
    return { name: clean[0].name, pid: clean[0].pid }
  }

  const count = (arr: Proc[]) => {
    const m = new Map<string, number>()
    for (const p of arr) m.set(p.name, (m.get(p.name) ?? 0) + 1)
    return m
  }
  const b = count(before)
  const a = count(after)
  for (const [name, cntA] of a) {
    const cntB = b.get(name) ?? 0
    if (cntA > cntB && !bad.has(name.toLowerCase())) {
      const found = after.find((p) => p.name === name)
      return { name, pid: found?.pid }
    }
  }
}
