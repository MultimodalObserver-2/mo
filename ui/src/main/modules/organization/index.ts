import { app, BrowserWindow, ipcMain } from "electron"

app.whenReady().then(() => {
  ipcMain.on("organization:reload-projects", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-reload-projects")
    })
  })

  ipcMain.on("organization:reload-participants", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-reload-participants")
    })
  })

  ipcMain.on("organization:change-selected-project", async (_event, project) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-change-selected-project", project)
    })
  })

  ipcMain.on("organization:change-selected-participant", async (_event, participant) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-change-selected-participant", participant)
    })
  })

  ipcMain.on("organization:add-activity", async (_event, activity) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-add-activity", activity)
    })
  })

  ipcMain.on("organization:update-activity", async (_event, originalName, activity) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-update-activity", originalName, activity)
    })
  })

  ipcMain.on("organization:reload-protocols", async () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-reload-protocols")
    })
  })

  ipcMain.on("organization:change-selected-protocol", async (_event, protocol) => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send("organization:on-change-selected-protocol", protocol)
    })
  })
})

import "./execProtocol"
import "./preferences"
