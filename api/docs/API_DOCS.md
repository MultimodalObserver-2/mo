<!-- omit in toc -->
# 📚 API Documentation

This document contains the HTTP API reference for the **Multimodal Observer** application.

The API is organized in **modules** to reflect the modular and extensible architecture of the platform. Each module is responsible for a set of related operations.

📌 While the API is in development, the full interactive documentation is available at:

- [Swagger UI](/docs)
- [ReDoc](/redoc)

These endpoints provide up-to-date details including request/response schemas, example payloads, and status codes.

---

## 📑 Table of Contents

- [📑 Table of Contents](#-table-of-contents)
- [📦 Module: Organization](#-module-organization)
  - [📁 Projects](#-projects)
  - [📁 Participants](#-participants)
- [🛠 General Information](#-general-information)

---

## 📦 Module: Organization

Operations for managing **projects** and **participants**.

---

### 📁 Projects

| Method   | Route                             | Description                              | Responses                                            |
| :------- | :-------------------------------- | :--------------------------------------- | :--------------------------------------------------- |
| `POST`   | `/projects/`                      | Create a new project.                    | 201 Created, 400 Bad Request, 409 Conflict           |
| `GET`    | `/projects/`                      | Retrieve all projects.                   | 200 OK                                               |
| `PUT`    | `/projects/{project_name}`        | Update a project’s name or description.  | 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict |
| `GET`    | `/projects/{project_name}`        | Retrieve a specific project by name.     | 200 OK, 404 Not Found                                |
| `DELETE` | `/projects/{project_name}`        | Delete a project by name.                | 204 No Content, 400 Bad Request, 404 Not Found       |
| `POST`   | `/projects/{project_name}/lock`   | Lock a project to prevent modifications. | 200 OK, 404 Not Found                                |
| `POST`   | `/projects/{project_name}/unlock` | Unlock a previously locked project.      | 200 OK, 404 Not Found                                |

---

### 📁 Participants

| Method   | Route                                                             | Description                              | Responses                                                 |
| :------- | :---------------------------------------------------------------- | :--------------------------------------- | :-------------------------------------------------------- |
| `POST`   | `/projects/{project_name}/participants/`                          | Create a new participant in a project.   | 201 Created, 400 Bad Request, 404 Not Found, 409 Conflict |
| `GET`    | `/projects/{project_name}/participants/`                          | Retrieve all participants in a project.  | 200 OK, 404 Not Found                                     |
| `PUT`    | `/projects/{project_name}/participants/{participant_code}`        | Update a participant’s data.             | 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict      |
| `GET`    | `/projects/{project_name}/participants/{participant_code}`        | Retrieve a specific participant by code. | 200 OK, 404 Not Found                                     |
| `DELETE` | `/projects/{project_name}/participants/{participant_code}`        | Delete a participant from a project.     | 204 No Content, 400 Bad Request, 404 Not Found            |
| `POST`   | `/projects/{project_name}/participants/{participant_code}/lock`   | Lock a participant to prevent changes.   | 200 OK, 404 Not Found                                     |
| `POST`   | `/projects/{project_name}/participants/{participant_code}/unlock` | Unlock a locked participant.             | 200 OK, 404 Not Found                                     |

---

## 🛠 General Information

- **Base URL**: `/`
- **Version**: `0.1.0`
- **Response Format**: `application/json`
- **Error Handling**: Errors return JSON responses like:

```json
{
  "detail": "Project not found"
}
