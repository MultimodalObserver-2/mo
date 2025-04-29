# MO API - Documentation

This documentation corresponds to the API of the **Multimodal Observer (MO)** desktop application, developed using **FastAPI** and managed with **Poetry**.  
Below are the instructions for initial setup and the most common commands used during development.

## Requirements

- [Python 3.12](https://www.python.org/)
- [Poetry 2.1](https://python-poetry.org/docs/)

## Initial Setup

1. Clone the repository and navigate to the `api` folder:

    ```bash
    git clone https://github.com/MultimodalObserver-2/mo
    cd api
    ```

2. Install project dependencies:

    ```bash
    poetry install
    ```

3. Copy the `.env.example` file and create your own `.env` file:

    ```bash
    cp .env.example .env
    ```

    Edit the `.env` file to set up your environment variables, such as `SONAR_TOKEN`.

4. (Optional) Activate a shell within the Poetry virtual environment:

    ```bash
    poetry shell
    ```

## Common Commands

The following custom scripts are defined in `pyproject.toml` to simplify common tasks:

| Command             | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `poetry run dev`    | Start the API in development mode.                                   |
| `poetry run format` | Format the codebase according to the project's style guide.          |
| `poetry run sonar`  | Run code quality analysis using SonarQube. Requires a `SONAR_TOKEN`. |
| `poetry run test`   | Execute the project's automated tests.                               |
| `poetry run build`  | Build the API for production.                                        |

### Notes about the commands

- **Running SonarQube**:
  - The environment variable `SONAR_TOKEN` must be defined.
  - It can be automatically loaded from the `.env` file if properly configured.
  - Alternatively, you can provide the token directly in the command without setting an environment variable:
    ```bash
    poetry run sonar -D"sonar.token=your_sonar_token"
    ```
    or
    ```bash
    poetry run sonar --token "your_sonar_token"
    ```

- **Running Tests**:
  - You can specify the type of tests to run using the `--type` flag:
    - Accepted values: `unit`, `integration`, or `all`.
  - Example:

    ```bash
    poetry run test --type unit
    ```

  - You can generate a coverage report using the `--cov-report` flag. Supported formats include `html`, `xml`, `json`, among others.

    ```bash
    poetry run test --cov-report xml
    ```

  - **Important**: To properly integrate test coverage into SonarQube analysis, you must generate the coverage report in **XML** format.

## Useful Poetry Commands

Below are some additional useful Poetry commands for managing dependencies:

| Command                            | Description                                     |
| ---------------------------------- | ----------------------------------------------- |
| `poetry add <package>`             | Add a package as a runtime dependency.          |
| `poetry add <package> --group dev` | Add a package as a development-only dependency. |
| `poetry remove <package>`          | Remove a package from the project.              |

For more information, see the [Poetry documentation](https://python-poetry.org/docs/cli/).
