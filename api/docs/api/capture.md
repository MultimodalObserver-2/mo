<!-- omit in toc -->
# 🎥 API Module: Capture

This module handles all operations related to data capture, including managing capture plugins, controlling capture processes, and handling capture configurations and sessions.

---
<!-- omit in toc -->
## 📑 Table of Contents

- [🧩 Capture Plugins](#-capture-plugins)
- [▶️ Capture Control](#️-capture-control)
- [⚙️ Capture Configurations](#️-capture-configurations)
- [📋 Capture Sessions](#-capture-sessions)

---

## 🧩 Capture Plugins

| Method | Route              | Description                             | Responses |
| ------ | ------------------ | --------------------------------------- | --------- |
| `GET`  | `/capture/plugins` | Retrieve all available capture plugins. | 200 OK    |

---

## ▶️ Capture Control

| Method | Route             | Description                                   | Responses                     |
| ------ | ----------------- | --------------------------------------------- | ----------------------------- |
| `POST` | `/capture/start`  | Start capture for a participant in a project. | 204 No Content, 400, 404, 422 |
| `POST` | `/capture/stop`   | Stop the current capture process.             | 204 No Content, 400           |
| `POST` | `/capture/pause`  | Pause the capture process.                    | 204 No Content, 400           |
| `POST` | `/capture/resume` | Resume the paused capture process.            | 204 No Content, 400           |
| `GET`  | `/capture/status` | Get the current status of the capture.        | 200 OK                        |

---

## ⚙️ Capture Configurations

| Method   | Route                                                    | Description                                    | Responses                      |
| -------- | -------------------------------------------------------- | ---------------------------------------------- | ------------------------------ |
| `POST`   | `/projects/{project_name}/capture/configs/`              | Add a new capture configuration for a project. | 200 OK, 400, 409 Conflict, 422 |
| `GET`    | `/projects/{project_name}/capture/configs/`              | Get all capture configurations for a project.  | 200 OK, 422                    |
| `GET`    | `/projects/{project_name}/capture/configs/{config_name}` | Get a specific capture configuration.          | 200 OK, 400, 404, 422          |
| `PUT`    | `/projects/{project_name}/capture/configs/{config_name}` | Update a specific capture configuration.       | 200 OK, 400, 404, 409, 422     |
| `DELETE` | `/projects/{project_name}/capture/configs/{config_name}` | Delete a capture configuration.                | 204 No Content, 400, 404, 422  |

---

## 📋 Capture Sessions

| Method   | Route                                                                            | Description                         | Responses                     |
| -------- | -------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------- |
| `GET`    | `/projects/{project_name}/participants/{participant_code}/sessions/`             | Get all sessions for a participant. | 200 OK, 422                   |
| `GET`    | `/projects/{project_name}/participants/{participant_code}/sessions/{session_id}` | Get a specific session by ID.       | 200 OK, 400, 404, 422         |
| `DELETE` | `/projects/{project_name}/participants/{participant_code}/sessions/{session_id}` | Delete a specific session by ID.    | 204 No Content, 400, 404, 422 |
