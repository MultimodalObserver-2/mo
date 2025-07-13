# 📁 Project Structure

This document describes the folder structure and responsibilities of the **Multimodal Observer (MO)** API codebase, located under the `src/` directory.

The API follows a modular, extensible and testable architecture built with **FastAPI**, organized around clean separation of concerns.

---

## 🔍 Key Directories

All key directories listed below are located under the `src/` folder, which contains the full source code of the application.

### `mo/`
This directory contains the logic of the application.

#### `mo/main.py`
- Defines the FastAPI app instance.
- Configures routers, middleware, exception handlers, and metadata.
- Sets up the logger configuration.
- Ensures application directories exist and are ready to use.

#### `mo/core/`
Contains logic reused across all modules.
  - `api/`: Core API functionality, such as base plugin management.
  - `config/`: Configuration management, loading environment variables, setting constants and initial setup.
  - `file_management/`: File validation, creation, management, and storage.
  - `plugin/`: Plugin lifecycle management and integration, plugin interfaces definition, and plugin-related utilities.
  - `utils/`: Generic helper functions or shared logic.

#### `mo/modules/`
Each subfolder represents a functional module (e.g., `organization`).

Modules can include:
  - `plugins/`: Specific plugins for the module.
  - `routers/`: FastAPI endpoints (`@router.get`, `@router.post`, etc.).
  - `schemas/`: Pydantic models used for input/output validation.
  - `services/`: Core business logic decoupled from the web layer.
  - `errors/`: Centralized exception messages or codes.

### `scripts/`

Top-level directory intended for CLI tools or automated tasks, such as:
  - `build.py`: Script to build the MO application using PyInstaller.
  - `dev.py`: Script to run the API in development mode.
  - `format.py`: Script to format the codebase using `black` and `isort`.
  - `set_prod_env.py`: Script to set up the production environment.
  - `sonar.py`: Script to run SonarQube analysis.
  - `test.py`: Script to run the project's automated tests.

---

## 🧪 Testing Structure

### `tests/`
- Top-level directory for all test code.
- Organized into:
  - `fixtures/`: Data and utilities for testing.
  - `integration/`: Tests across components and external behavior.
  - `unit/`: Isolated tests for internal logic.

#### `tests/unit/core/` and `tests/unit/modules/`
- Mirrors the structure of the `mo/core/` and `mo/modules/` directories.
- Each test file begins with `test_` (e.g., `test_file_management.py`) and is associated with a specific file or function.
- This layout encourages maintainable and targeted testing.

---

## 🌐 Internationalization (i18n)

The API supports full internationalization using [i18nice](https://github.com/solaluset/i18nice).

- **Translation Files Location:**  
  All translation files are stored under `resources/locales/{lng}/{ns}.json`, where:
  - `{lng}` is the language code (e.g., `en`, `es`)
  - `{ns}` is the namespace (e.g., `core`, `organization`, `capture`, `visualization`)

- **Namespaces and Structure:**  
  Each namespace (such as `core`, `organization`, `capture`, etc.) contains its own JSON file for translations.

- **Translation Usage:**  
  Use the provided `translate(key, **kwargs)` function anywhere in the codebase to translate strings.  
  This function acts as a wrapper around `i18n.t` and supports variable interpolation using keyword arguments.

- **Adding or Updating Translations:**  
  - To add a new translation key, update the appropriate `{ns}.json` file under `resources/locales/{lng}/`.
  - To support a new language, add a folder for that language (e.g., `es`) and corresponding namespace files.

---

## ⚙️ Configuration and other files

| File                       | Purpose                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `.env`                     | Environment variables used in local development.                                                 |
| `.env.example`             | Template for `.env`.                                                                             |
| `pyproject.toml`           | Poetry project configuration: dependencies, scripts, metadata, and tool integrations.            |
| `mo_api.build.spec`        | Specification file for building the MO application (e.g., using PyInstaller).                    |
| `sonar-project.properties` | Configuration for SonarQube static code analysis (project key, coverage path, exclusions, etc.). |
| `README.md`                | 📖 General guide: setup instructions, dependency management, and development commands.            |
| `docs/STRUCTURE.md`        | 📁 Directory and architecture overview (this file).                                               |
| `docs/api/`                | 📚 API documentation files for each module and core endpoints.                                    |

---

## 📌 Notes

- This layout promotes clear modular separation, ease of testing, and maintainability.
- New features should be added as new modules under `src/mo/modules/`.
- Each module should contain its own routers, services, schemas, and whatever else is needed for that module's functionality.
- The `src/mo/core/` directory should only contain shared logic that is not specific to any module.

---
