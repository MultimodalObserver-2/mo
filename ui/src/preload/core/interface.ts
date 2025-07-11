/**
 * @fileoverview
 * TypeScript interface describing all APIs and services exposed from the Electron preload layer
 * to the renderer process via `window.core`.
 *
 * Only methods and objects declared in this interface will be available to the frontend.
 *
 * Each property groups related APIs (dialogs, file system, shell, routing, plugins, etc).
 */

import { MessageBoxOptions, MessageBoxReturnValue, OpenDialogReturnValue } from "electron"
import { Resource } from "i18next"
import { NavigateOptions } from "react-router"

/**
 * Represents the status of a registered hotkey action.
 * Contains information about the hotkey's ID, label, key combination,
 * type (simple/complementary), and optional group ID and warning message.
 */
export interface HotkeyStatus {
  id: string
  label: string
  actualKey: string
  defaultKey?: string
  type: "simple" | "complementary"
  groupId?: string
}

export default interface CoreAPI {
  /**
   * Opens a modal window with the given options and endpoint.
   *
   * @param args - Configuration for the modal, including window options, content endpoint,
   *               optional auto height adjustment, and parent/name identifiers.
   */
  openModalWindow: (args: {
    options: Electron.BrowserWindowConstructorOptions
    endpoint: string
    autoAdjustHeight?: {
      elementId: string
      extraHeight?: number
      errorHeight?: number
      setMinimumSize?: boolean
    }
    parent?: string
    name?: string
  }) => void

  /**
   * Native dialog APIs for showing messages and picking files.
   */
  dialog: {
    /**
     * Shows a system error dialog.
     * @param title - The dialog title.
     * @param content - The error message content.
     */
    showErrorBox: (title: string, content: string) => void

    /**
     * Shows a message box dialog with custom options, returns user's response.
     * @param options - Options for the message box (buttons, title, etc).
     * @returns Promise that resolves to the user's response.
     */
    showMessageBox: (options: MessageBoxOptions) => Promise<MessageBoxReturnValue>

    /**
     * Opens a system file/folder selection dialog.
     * @param options - Options for file/folder selection.
     * @returns Promise that resolves to the dialog result (selected paths, etc).
     */
    showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<OpenDialogReturnValue>
  }

  /**
   * System clipboard API for writing text to the clipboard.
   */
  clipboard: {
    /**
     * Copies text to the system clipboard.
     * @param text - The string to copy.
     */
    writeText: (text: string) => void
  }

  /**
   * Shell utility API for opening files or folders with the system default application.
   */
  shell: {
    /**
     * Opens the given path (file or folder) using the OS default handler.
     * @param path - The path to open.
     */
    openPath: (path: string) => void
  }

  /**
   * API for retrieving runtime configuration in production.
   */
  prod: {
    /**
     * Gets the port number used by the backend API server in production mode.
     * @returns Promise resolving to the API port number.
     */
    getApiPort: () => Promise<number>
  }

  /**
   * Plugin system APIs for managing and reloading plugins at runtime.
   */
  plugins: {
    /**
     * Triggers a reload of all plugins.
     */
    reloadPlugins: () => void

    /**
     * Registers a callback to be called when plugins are reloaded.
     * @param callback - Function to execute when plugins are reloaded.
     */
    onReloadPlugins: (callback: () => void) => void

    /**
     * Removes the reload plugins event listener.
     */
    removeReloadPlugins: () => void
  }

  /**
   * Application-level paths, e.g., plugins folder.
   */
  app: {
    paths: {
      /**
       * Gets the path to the plugins directory.
       * @returns Promise that resolves to the plugin directory path.
       */
      plugins: () => Promise<string>

      /**
       * Gets the path to the locales directory.
       * @returns Promise that resolves to the locales directory path.
       */
      locales: () => Promise<string>
    }
  }

  /**
   * Archive utilities for extracting zip files.
   */
  zip: {
    /**
     * Extracts a zip archive buffer to the given destination path.
     * @param buffer - The zip file as an ArrayBuffer.
     * @param destPath - Destination folder path.
     * @returns Promise that resolves with a success flag and optional error message.
     */
    extract: (
      buffer: ArrayBuffer,
      destPath: string
    ) => Promise<{ success: boolean; error?: string }>
  }

  /**
   * File system APIs for reading, writing, checking, and manipulating files and folders.
   * All methods are asynchronous and sandboxed.
   */
  fs: {
    /**
     * Reads a file and returns its content as a Buffer or string.
     * @param filePath - The path to the file.
     * @param encoding - Optional encoding ("utf-8" for text, otherwise Buffer).
     * @returns Promise resolving to the file content.
     */
    readFileSync: (filePath: string, encoding?: string) => Promise<Buffer | string>

    /**
     * Writes content to a file, creating or overwriting it.
     * @param filePath - The file path.
     * @param content - The content to write.
     * @returns Promise that resolves when the write is complete.
     */
    writeFileSync: (filePath: string, content: string) => Promise<void>

    /**
     * Reads the names of files/folders in a directory.
     * @param dirPath - The directory path.
     * @returns Promise resolving to an array of entry names.
     */
    readdirSync: (dirPath: string) => Promise<string[]>

    /**
     * Checks if a file or directory exists.
     * @param filePath - The path to check.
     * @returns Promise resolving to true if exists, false otherwise.
     */
    existsSync: (filePath: string) => Promise<boolean>

    /**
     * Removes a file or directory.
     * @param filePath - Path to the item to remove.
     * @param options - Optional recursive/force options for directories.
     * @returns Promise that resolves when removal is complete.
     */
    rmSync: (filePath: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>

    /**
     * Checks if a path is a directory.
     * @param filePath - Path to check.
     * @returns Promise resolving to true if the path is a directory.
     */
    isDirectory: (filePath: string) => Promise<boolean>
  }

  /**
   * Path utilities for joining, parsing, and working with file paths.
   */
  path: {
    /**
     * Joins multiple path segments into a single path string.
     * @param paths - The path segments.
     * @returns Promise resolving to the joined path.
     */
    join: (...paths: string[]) => Promise<string>

    /**
     * Returns the last portion of a path (e.g., file name).
     * @param filePath - The path to extract from.
     * @returns Promise resolving to the base name.
     */
    basename: (filePath: string) => Promise<string>

    /**
     * Returns the file extension (including the dot) from a path.
     * @param filePath - The path to extract from.
     * @returns Promise resolving to the extension string.
     */
    extname: (filePath: string) => Promise<string>
  }

  /**
   * Navigation and routing APIs to allow navigation from the main process or plugins.
   */
  router: {
    /**
     * Navigates to a given path within the application.
     * @param path - Target route path.
     * @param options - Optional navigation options (replace, state, etc).
     */
    navigate: (path: string, options?: NavigateOptions) => void

    /**
     * Registers a callback for navigation events triggered by the main process.
     * Returns an unsubscribe function to remove the listener.
     * @param callback - Function called with the navigation path and options.
     * @returns Unsubscribe function.
     */
    onNavigate: (callback: (path: string, options?: NavigateOptions) => void) => () => void
  }

  /**
   * Preferences management API for storing and retrieving application settings.
   */
  preferences: {
    /**
     * Gets a preference value by key.
     * @param key - The preference key.
     * @returns The preference value or undefined if not set.
     */
    get: <T = unknown>(key: string) => T | undefined

    /**
     * Sets a preference value by key.
     * @param key - The preference key.
     * @param value - The value to set.
     */
    set: <T = unknown>(key: string, value: T) => void

    /**
     * Removes a preference by key.
     * @param key - The preference key to remove.
     */
    remove: (key: string) => void

    /**
     * Gets all preferences as an object.
     * @returns All stored preferences.
     */
    getAll: () => Record<string, unknown>

    /**
     * Resets all preferences to their default state.
     */
    reset: () => void

    /**
     * Checks if a preference exists by key.
     * @param key - The preference key to check.
     * @returns True if the preference exists, false otherwise.
     */
    has: (key: string) => boolean

    /**
     * Extends a preference with additional properties.
     * @param key - The preference key to extend.
     * @param partialValue - Partial value to merge into the existing preference.
     */
    extend: (key: string, partialValue: Record<string, unknown>) => void
  }

  /**
   * Hotkeys management API for registering and managing keyboard shortcuts
   * on defined actions.
   */
  hotkeys: {
    /**
     * Retrieves all registered hotkeys.
     * @returns Promise resolving to an array of hotkey objects.
     */
    getAll: () => Promise<HotkeyStatus[]>

    /**
     * Gets the hotkey for a specific action by its ID.
     * @param actionId - The action ID to retrieve the hotkey for.
     * @returns Promise resolving to the hotkey string or undefined if not set.
     */
    get: (actionId: string) => Promise<string | undefined>

    /**
     * Sets a new hotkey for a specific action.
     * @param actionId - The action ID to set the hotkey for.
     * @param keyCombination - The new key combination string.
     */
    set: (actionId: string, keyCombination: string) => Promise<boolean>

    /**
     * Resets the hotkey for a specific action to its default state.
     * @param actionId - The action ID to reset the hotkey for.
     */
    reset: (actionId: string) => void
    /**
     * Disables all hotkeys, unregistering them from the system.
     */
    disable: () => void

    /**
     * Enables all hotkeys, re-registering them with the system.
     */
    enable: () => void
  }

  /**
   * Options management API for boolean options that can be toggled on/off.
   */
  options: {
    /**
     * Gets the value of a specific option by key.
     * @param key - The option key.
     * @returns Promise resolving to the option value (boolean).
     */
    get: (key: string) => Promise<boolean>

    /**
     * Sets the value of a specific option by key.
     * @param key - The option key.
     * @param value - The new value (true/false).
     */
    set: (key: string, value: boolean) => Promise<void>

    /**
     * Gets all registered options with their current values.
     * @returns Promise resolving to an array of option definitions with values.
     */
    getAll: () => Promise<
      Array<{
        id: string
        label: string
        type: string
        value: boolean
      }>
    >
  }

  /**
   * Internationalization (i18n) API for managing translations and language settings.
   */
  i18n: {
    /**
     * Gets the initial i18n data, including current language and resources.
     * @returns Promise resolving to the initial i18n data.
     */
    getInitialData: () => Promise<{
      lng: string
      fallbackLng: string
      ns: string[]
      fallbackNS: string
      resources: Resource
    }>

    /**
     * Changes the current language for translations.
     * @param language - The new language code (e.g., "en", "es").
     * @returns Promise resolving when the language change is complete.
     */
    changeLanguage: (language: string) => Promise<{
      language: string
      resources: Resource
    }>
  }
}
