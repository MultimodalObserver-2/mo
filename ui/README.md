# 💻 MO UI - General Documentation

This document provides the **general setup, usage, and build instructions** for the user interface of the **Multimodal Observer (MO)** desktop application.  
The UI is built using **React**, **TypeScript**, and packaged with **Electron + Vite** through [electron-vite](https://electron-vite.org/).

- For an overview of the directory layout and source code structure, see the [📁 Project Structure Overview](./docs/STRUCTURE.md).
- For API-related information, refer to the [📦 MO API Documentation](../api/README.md).

---

## ⚙️ Requirements

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [electron-vite](https://electron-vite.org/) (included as a dependency)

> 💡 Recommended IDE setup:
>
> - [Visual Studio Code](https://code.visualstudio.com/)
> - Extensions: [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint), [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## 🚀 Initial Setup

1. Clone the repository and navigate to the `ui` folder:

   ```bash
   git clone https://github.com/MultimodalObserver-2/mo
   cd ui
   ```

2. Install project dependencies:

   ```bash
   npm install
   ```

3. Copy the `.env.example` file and create your own `.env` file:

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file to set up your environment variables.  
   The following variables must be configured:

   - `SONAR_TOKEN`: Your SonarQube authentication token.
   - `VITE_DEV_API_PORT`: The port where the API is served during development (default: `8000`).

---

## 🛠️ Common Commands

The following scripts are defined in `package.json` to simplify development and deployment:

| Command                | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Start the Electron + Vite app in development mode.                     |
| `npm run dev:watch`    | Start in development mode with file watching enabled for node code.    |
| `npm run start`        | Launch the built app (preview mode).                                   |
| `npm run build`        | Type-check and bundle the app for production.                          |
| `npm run build:win`    | Build the application for Windows.                                     |
| `npm run build:mac`    | Build the application for macOS.                                       |
| `npm run build:linux`  | Build the application for Linux.                                       |
| `npm run build:unpack` | Build without packaging into an installer.                             |
| `npm run sonar`        | Run SonarQube scan. Requires `SONAR_TOKEN` to be configured in `.env`. |
| `npm run format`       | Format the codebase using Prettier.                                    |
| `npm run lint`         | Run ESLint checks.                                                     |
| `npm run typecheck`    | Run type checking for both Node and Web targets.                       |

### 🔹 Notes about the commands

- **SonarQube Integration**:
  - The `SONAR_TOKEN` must be set in the `.env` file before running `npm run sonar`.
- **Build targets**:
  - Ensure you're on the correct operating system when running platform-specific builds (e.g., `build:mac` on macOS).
  - You can use `build:unpack` for raw builds without creating platform installers.

---
