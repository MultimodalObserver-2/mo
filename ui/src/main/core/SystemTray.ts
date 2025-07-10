import { app, BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions, Tray } from "electron"
import { getMainWindow, setForceQuit } from ".."

type MenuItemArray = Array<MenuItemConstructorOptions | MenuItem>

export class SystemTray {
  private tray: Tray | null = null
  private contextMenu: Menu | null = null
  private mainWindow: BrowserWindow | null = null

  constructor() {
    this.mainWindow = getMainWindow()
    this.createTray()
    this.registerWindowEvents()
  }

  private createTray(): void {
    this.tray = new Tray("resources/icon.png")
    this.contextMenu = Menu.buildFromTemplate([
      { id: "hide", label: "Hide", click: () => this.toggleVisibility() },
      {
        id: "quit",
        label: "Quit",
        click: () => {
          setForceQuit(true)
          app.quit()
        }
      }
    ])
    this.tray.setToolTip("Multimodal Observer")
    this.tray.setContextMenu(this.contextMenu)
    this.tray.on("click", () => this.showApp())
  }

  private registerWindowEvents(): void {
    if (!this.mainWindow) return

    this.mainWindow.on("show", () => {
      this.setMenuItemLabel("hide", "Hide")
    })

    this.mainWindow.on("hide", () => {
      this.setMenuItemLabel("hide", "Show")
    })

    this.mainWindow.on("minimize", () => {
      this.setMenuItemLabel("hide", "Show")
    })

    this.mainWindow.on("restore", () => {
      this.setMenuItemLabel("hide", "Hide")
    })
  }

  private showApp(): void {
    if (this.mainWindow) {
      this.mainWindow.show()
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      this.mainWindow.focus()
    }
  }

  private buildContextMenu(template: MenuItemArray): void {
    this.contextMenu = Menu.buildFromTemplate(template)
    if (this.tray) {
      this.tray.setContextMenu(this.contextMenu)
    }
  }

  public extendContextMenu(template: MenuItemConstructorOptions[]): void {
    if (!this.contextMenu) return

    const updatedItems = this.contextMenu.items.filter(
      (item) => !template.some((newItem) => newItem.id && newItem.id === item.id)
    )

    const newMenuItems = [...template, ...updatedItems]

    this.buildContextMenu(newMenuItems)
  }

  public changeIcon(iconPath: string): void {
    if (this.tray) {
      this.tray.setImage(iconPath)
    }
  }

  public removeMenuItem(id: string): void {
    if (this.contextMenu) {
      const itemIndex = this.contextMenu.items.findIndex((item) => item.id === id)
      if (itemIndex !== -1) {
        this.contextMenu.items.splice(itemIndex, 1)
        this.buildContextMenu(this.contextMenu.items)
      }
    }
  }

  public getMenuItem(id: string): MenuItem | undefined {
    if (this.contextMenu) {
      return this.contextMenu.items.find((item) => item.id === id)
    }
    return undefined
  }

  public hideMenuItem(id: string): void {
    if (this.contextMenu) {
      const item = this.getMenuItem(id)
      if (item) {
        item.visible = false
        this.buildContextMenu(this.contextMenu.items)
      }
    }
  }

  public unhideMenuItem(id: string): void {
    if (this.contextMenu) {
      const item = this.getMenuItem(id)
      if (item) {
        item.visible = true
        this.buildContextMenu(this.contextMenu.items)
      }
    }
  }

  public disableMenuItem(id: string): void {
    const item = this.getMenuItem(id)
    if (item && this.contextMenu) {
      item.enabled = false
      this.buildContextMenu(this.contextMenu.items)
    }
  }

  public enableMenuItem(id: string): void {
    const item = this.getMenuItem(id)
    if (item && this.contextMenu) {
      item.enabled = true
      this.buildContextMenu(this.contextMenu.items)
    }
  }

  public setMenuItemLabel(id: string, label: string): void {
    const item = this.getMenuItem(id)
    if (item && this.contextMenu) {
      item.label = label
      this.buildContextMenu(this.contextMenu.items)
    }
  }

  private toggleVisibility(): void {
    if (!this.mainWindow) return

    const isVisible = this.mainWindow.isVisible()

    if (isVisible) {
      this.mainWindow.hide()
      this.setMenuItemLabel("hide", "Show")
    } else {
      this.mainWindow.show()
      if (this.mainWindow.isMinimized()) this.mainWindow.restore()
      this.mainWindow.focus()
      this.setMenuItemLabel("hide", "Hide")
    }
  }
}
