# 📁 Project Structure

This document describes the folder structure and responsibilities of the **Multimodal Observer (MO)** API codebase, located under the `src/` directory.

The API follows a modular, extensible and testable architecture built with **FastAPI**, organized around clean separation of concerns.

---

## 🔍 Key Directories

All key directories listed below are located under the `src/` folder, which contains the full source code of the application.

### `api/`
This directory contains the logic of the application.

#### `api/main.py`
- Defines the FastAPI app instance.
- Loads routers, CORS middleware, exception handlers, and metadata.

#### `api/core/`
- Contains logic reused across all modules.
  - `config/`: Configuration management, loading environment variables, setting constants and initial setup.
  - `file_management/`: File validation, creation, and access control.
  - `utils/`: Generic helper functions or shared logic.

#### `api/modules/`
- Each subfolder represents a functional module (e.g., `organization`).
- Modules include:
  - `routers/`: FastAPI endpoints (`@router.get`, `@router.post`, etc.).
  - `schemas/`: Pydantic models used for input/output validation.
  - `services/`: Core business logic decoupled from the web layer.
  - `errors/`: Centralized exception messages or codes.

### `scripts/`
- Top-level directory intended for CLI tools or automated tasks.

---

## 🧪 Testing Structure

### `tests/`
- Top-level directory for all test code.
- Organized into:
  - `integration/`: Tests across components and external behavior.
  - `unit/`: Isolated tests for internal logic.

#### `tests/unit/core/` and `tests/unit/modules/`
- Mirrors the structure of the `api/core/` and `api/modules/` directories.
- Each test file begins with `test_` (e.g., `test_file_management.py`) and is associated with a specific file or function.
- This layout encourages maintainable and targeted testing.

---

## ⚙️ Configuration Files

| File                       | Purpose                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| `.env`                     | Environment variables used in local development.                                                 |
| `.env.example`             | Template for `.env`.                                                                             |
| `pyproject.toml`           | Poetry project configuration: dependencies, scripts, metadata, and tool integrations.            |
| `mo_api.build.spec`        | Specification file for building the MO application (e.g., using PyInstaller).                    |
| `sonar-project.properties` | Configuration for SonarQube static code analysis (project key, coverage path, exclusions, etc.). |
| `README.md`                | 📖 General guide: setup instructions, dependency management, and development commands.            |
| `docs/API_DOCS.md`         | 📚 Full documentation of the API endpoints, grouped by module and feature.                        |
| `docs/STRUCTURE.md`        | 📁 Directory and architecture overview (this file).                                               |

---

## 📌 Notes

- This layout promotes clear modular separation, ease of testing, and maintainability.
- New features should be added as new modules under `src/api/modules/`.
- Each module should contain its own routers, services, schemas, and test coverage.
- The `src/api/core/` directory should only contain shared logic that is not specific to any module.

---
