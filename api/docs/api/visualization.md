<!-- omit in toc -->
# 🖼️ Module: Visualization

This module handles all operations related to **playback configurations** and **playback layouts** within a project.  
It allows you to create, retrieve, update, and delete playback configurations, as well as save and get playback layouts for each project.

---
<!-- omit in toc -->
## 📑 Table of Contents

- [⚙️ Playback Configurations](#️-playback-configurations)
- [📐 Playback Layout](#-playback-layout)

---

## ⚙️ Playback Configurations

| Method | Route                                                     | Description                            | Responses                                            |
| ------ | --------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| POST   | `/projects/{project_name}/playback/configs`               | Add a new playback configuration.      | 200 OK, 400 Bad Request, 409 Conflict                |
| GET    | `/projects/{project_name}/playback/configs`               | Get all playback configurations.       | 200 OK                                               |
| GET    | `/projects/{project_name}/playback/configs/{config_name}` | Get a specific playback configuration. | 200 OK, 400 Bad Request, 404 Not Found               |
| PUT    | `/projects/{project_name}/playback/configs/{config_name}` | Update a playback configuration.       | 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict |
| PUT    | `/projects/{project_name}/playback/configs/{config_name}/visibility` | Update visibility of playback configuration. | 200 OK, 400 Bad Request, 404 Not Found               |
| DELETE | `/projects/{project_name}/playback/configs/{config_name}` | Delete a playback configuration.       | 204 No Content, 400 Bad Request, 404 Not Found       |

---

## 📐 Playback Layout

| Method | Route                                      | Description           | Responses                              |
| ------ | ------------------------------------------ | --------------------- | -------------------------------------- |
| POST   | `/projects/{project_name}/playback/layout` | Save playback layout. | 200 OK, 400 Bad Request, 404 Not Found |
| GET    | `/projects/{project_name}/playback/layout` | Get playback layout.  | 200 OK, 404 Not Found                  |

---
