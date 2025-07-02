# 📁 Project Structure

This document describes the folder structure and responsibilities of the **Multimodal Observer (MO)** UI codebase, located under the `src/` directory.

The UI is built with **React**, **TypeScript**, and **Electron**, structured for modularity and scalability using [electron-vite](https://electron-vite.org/).

---

## 🔍 Key Directories

All major code is located under the `src/` folder, which is divided into three top-level layers:

- `main/`: Electron main process.
- `preload/`: Electron preload scripts (context bridging).
- `renderer/`: Frontend rendered with React.

---

### `src/main/`

Responsible for the Electron main process logic.

- **`core/`**: Common services or helpers for the Electron app.
- **`modules/`**: Electron-level features organized by domain.
- **`index.ts`**: Entry point for the Electron main process. Initializes the app window and event listeners.
- **`env.d.ts`**: TypeScript declarations.

---

### `src/preload/`

Contains preload scripts that safely expose APIs to the renderer process.

- **`core/`**: Shared logic for context bridging.
- **`modules/`**: Exposed APIs grouped by feature.
- **`/interface.ts`**: Define the TypeScript interface for the API exposed to the renderer process. This file should be imported into index.d.ts to properly expose the module's API in the preload layer.
- **`index.ts` / `index.d.ts`**: Entry points for the preload logic and TypeScript declarations.

---

### `src/renderer/`

Frontend logic implemented with React.

#### `src/renderer/src/`

Main React app source directory.

- **`core/`**: Global resources shared across the app.
  - `assets/`: Static images or fonts.
  - `components/`: Reusable UI components (buttons, inputs, icons etc.).
  - `layouts/`: Layout containers used to wrap pages.
  - `lib/`: Third-party wrappers or custom utilities.
  - `pages/`: React pages routed by the application.
  - `plugin/`: Core logic for the plugin system (base types, manager, utils).
  - `services/`: API or business logic functions.
  - `store/`: Global state management (Redux, registries, etc...).
  - `types/`: TypeScript type definitions.
  - `utils/`: Utility functions.

- **`modules/`**: Feature-specific logic organized by domain.
  - Each module can have:
    - `components/`: Module-specific UI components.
    - `pages/`: Pages related to this feature.
    - `services/`: API or business logic functions.
    - `store/`: State management (Redux slices, registries, etc.).
    - `types/`: TypeScript type definitions.
    - `utils/`: Local utility functions.
    - `plugin/`: Extensions to the plugin system, if the module supports plugins.
    - `routes.tsx`: Module routes, registered in the central app router.

- **`shared/`**: Public API surface for plugin development.
  - **Purpose**: This directory exports all classes, types, and utilities that are officially supported for external plugins. Everything exported here is available via the "mo" import map.
  - Update this file when adding new plugin features or types you want to expose.

- **`registrations/`**: Static registration functions for panels, controls, and extensibility points.
  - Each file registers components or providers (e.g., panel items, config providers) into global or module-level registries.
  - the `index.ts` runs all registrations at app startup.

- **`main.tsx`**: App entry point. Performs all startup registrations, plugin loading, and renders the root app.
- **`app.tsx`**: Central router. Composes all module routes and shared layouts.
- **`store.ts`**: Central Redux store entry point
- **`index.html`**: HTML template for the renderer.
- **`env.d.ts`**: TypeScript declarations for the renderer process.

---

### `src/renderer/stories/`

All visual documentation and interaction/unit tests for UI components are maintained using [Storybook](https://storybook.js.org/).

- **Purpose**:  
  This directory contains all Storybook stories for the app, organized into subfolders by core, modules, and component type.
- **Structure**:  
  - `core/`: Stories for core components.
  - `modules/`: Stories for module-specific components.
- Each story uses the `.stories.ts` or `.stories.tsx` format and includes controls, usage examples, and interaction tests when relevant.

> **Tip:** To run Storybook locally, use `npm run storybook`. For details, see the [UI README](../README.md).

---

## 🧭 Routing System

- **Module-based Routing**:  
  Each feature module (such as `organization`, `visualization`, etc.) defines its own routes in a `routes.tsx` file.  
  This allows every module to manage its own navigation and makes the app extensible and modular.

- **Central Router**:  
  The app’s entry point (`app.tsx`) composes all module routes using React Router, placing them in shared layouts (such as `AppLayout`, `SideBarLayout`).  
  Add new module routes to the central router by importing their `routes.tsx` file and nesting them as needed.

- **Layouts**:  
  Layout containers are used to provide consistent navigation, sidebars, and UI chrome for route groups.

- **Startup**:  
  `main.tsx` is responsible for initializing the store, loading plugins, running all static registrations, and then rendering the root `<App />` with routing.

---

## 📚 Registry System

- **Purpose**:  
  Registries provide extensibility points within the UI, allowing both the core and modules to register new components (such as panel items, panel controls, configuration providers, etc.) at startup.

- **Per-Module Registries**:  
  Each module can define its own registries in its `store/` directory (e.g., `panelRegistry`, `panelControlsRegistry`, `configProviderRegistry`).  
  Registries typically provide methods like `register`, `unregister`, `registerMany`, and `getItems`.

- **Registrations Folder**:  
  The `registrations/` directory contains registration functions that populate the various registries.  
  At app startup, `registrations/index.ts` runs all registration functions to ensure all extensible UI points are populated.

- **Scope**:  
  Registries are primarily intended for modular UI extensibility—*not* for plugins (at least not yet).

---

## 🧩 Plugin Architecture

- **Core Plugin System**:  
  All logic for the plugin framework lives under `core/plugin/`. This includes base plugin types, the plugin manager, plugin utils, and all contracts for plugin development.

- **Module Extensions**:  
  Modules can extend the plugin system by adding their own base plugin classes (for example, `PlaybackPlugin` in `modules/visualization/plugin/`), enabling new plugin types specific to a feature.

- **Public Plugin API (`shared/`)**:  
  Only APIs, classes, and types exported from the `shared/` directory are made available to external plugin developers (via the `"mo"` import map).  
  **If you want a new extension point or base class to be available for plugins, it must be exported from `shared/index.ts`.**

---

## ⚙️ Configuration Files

| File                       | Purpose                                                              |
| -------------------------- | -------------------------------------------------------------------- |
| `.env`                     | Environment variables used in local development.                     |
| `.env.example`             | Template for `.env`. Includes `SONAR_TOKEN` and `VITE_DEV_API_PORT`. |
| `electron-builder.yml`     | Configuration for building and packaging the Electron app.           |
| `electron.vite.config.ts`  | Vite + Electron configuration (entry points, preload, build setup).  |
| `eslint.config.mjs`        | ESLint configuration for linting JavaScript/TypeScript.              |
| `prettier.config.yaml`     | Prettier configuration for code formatting.                          |
| `tsconfig*.json`           | TypeScript project configurations (shared, node, web contexts).      |
| `package.json`             | Project metadata, scripts, and dependencies.                         |
| `sonar-project.properties` | Configuration for SonarQube static code analysis.                    |
| `README.md`                | 📖 General setup, development, and build instructions.                |
| `docs/STRUCTURE.md`        | 📁 This file: directory and architecture overview.                    |

---

## 📌 Notes

- The structure supports **separation of concerns** between the Electron main process and the React renderer.
- New specific features not related to existing modules should be added under `src/renderer/src/modules/`.
- Shared code across modules should reside under `src/renderer/src/core/`.
- Preload logic must be defined carefully to securely expose APIs via context bridge.
- Build and package behavior is configured via `electron-builder.yml`.
- When extending or creating a new **registry**, be sure to update the relevant registry logic and its static registration
- When adding new plugin APIs or extension points for plugin authors, be sure to update `shared/index.ts` so they are properly exported.

---
