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
- **`index.ts` / `index.d.ts`**: Entry points for the preload logic and TypeScript declarations.

---

### `src/renderer/`

Frontend logic implemented with React.

#### `src/renderer/src/`

Main React app source directory.

- **`core/`**: Global resources shared across the app.

  - `assets/`: Static images or fonts.
  - `components/`: Reusable UI components (buttons, inputs, etc.).
  - `layouts/`: Layout containers used to wrap pages.
  - `lib/`: Third-party wrappers or custom utilities.
  - `pages/`: React pages routed by the application.
  - `store/`: Global state management (Redux).
  - `utils/`: Utility functions.

- **`modules/`**: Feature-specific logic organized by domain.

  - `organization/`: Example module with subfolders:
    - `components/`: Module-specific UI components.
    - `pages/`: Pages related to this feature.
    - `services/`: API or business logic functions.
    - `store/`: Global state handling for the module.
    - `types/`: TypeScript type definitions.
    - `utils/`: Local utility functions.

- **`main.tsx`**: React app entry point.
- **`index.html`**: HTML template for the renderer.

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
| `README.md`                | 📖 General setup, development, and build instructions.               |
| `docs/STRUCTURE.md`        | 📁 This file: directory and architecture overview.                   |

---

## 📌 Notes

- The structure supports **separation of concerns** between the Electron main process and the React renderer.
- New features should be added as modules under `src/renderer/src/modules/`.
- Shared code across modules should reside under `src/renderer/src/core/`.
- Preload logic must be defined carefully to securely expose APIs via context bridge.
- Build and package behavior is configured via `electron-builder.yml`.

---
