<!-- omit in toc -->
# 📚 API Documentation

This document contains the HTTP API reference for the **Multimodal Observer** application.

The API is organized in **modules** to reflect the modular and extensible architecture of the platform. Each module is responsible for a set of related operations.

📌 While the API is in development, the full interactive documentation is available at:

- [Swagger (/docs)](http://localhost:8000/docs)
- [ReDoc (/redoc)](http://localhost:8000/redoc)

These endpoints provide up-to-date details including request/response schemas, example payloads, and status codes.

---

## 📑 Table of Contents

- [📑 Table of Contents](#-table-of-contents)
- [📦 Module: Organization](#-module-organization)
  - [📁 Projects](#-projects)
  - [📁 Participants](#-participants)
  - [📁 Protocols](#-protocols)
- [🛠 General Information](#-general-information)

---

## 📦 Module: Organization

Operations for managing **projects**, **participants** and **protocols**.

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

### 📁 Protocols

| Method   | Route                                                       | Description                           | Responses                                                 |
| :------- | :---------------------------------------------------------- | :------------------------------------ | :-------------------------------------------------------- |
| `POST`   | `/projects/{project_name}/protocols/`                       | Create a new protocol.                | 201 Created, 400 Bad Request, 404 Not Found, 409 Conflict |
| `GET`    | `/projects/{project_name}/protocols/`                       | Retrieve all protocols in a project.  | 200 OK, 404 Not Found                                     |
| `GET`    | `/projects/{project_name}/protocols/{protocol_name}`        | Retrieve a specific protocol by name. | 200 OK, 400 Bad Request, 404 Not Found                    |
| `PUT`    | `/projects/{project_name}/protocols/{protocol_name}`        | Update a protocol’s data.             | 200 OK, 400 Bad Request, 404 Not Found, 409 Conflict      |
| `DELETE` | `/projects/{project_name}/protocols/{protocol_name}`        | Delete a protocol from a project.     | 204 No Content, 400 Bad Request, 404 Not Found            |
| `POST`   | `/projects/{project_name}/protocols/{protocol_name}/lock`   | Lock a protocol to prevent changes.   | 200 OK, 400 Bad Request, 404 Not Found                    |
| `POST`   | `/projects/{project_name}/protocols/{protocol_name}/unlock` | Unlock a locked protocol.             | 200 OK, 400 Bad Request, 404 Not Found                    |

> 📡 **WebSocket Endpoint**  
> `GET` `/projects/{project_name}/protocols/{protocol_name}/execute`  
> **Description**: Executes a **research protocol** interactively via WebSocket, guiding the client through a sequence of predefined activities. Each activity can involve instructions, timers, media handling, or external process execution.

<!-- omit in toc -->
#### 🔁 Execution Flow

1. **Connection Start**  
   The client establishes a WebSocket connection. The server loads the specified protocol and begins iterating through its ordered list of activities.

2. **Activity Start**  
   - The server sends a `start` message in JSON format:
      ```json
        {
          "activity_name": "Consent Form",
          "activity_num": 1,
          "message": "Please read the consent form.",
          "message_type": "start",
          "show_timer": false,
          "total_activities": 3,
          "has_time_limit": false
        }
      ```
   - The client must respond with: `start`

3. **Activity Execution**
   - If the activity specifies a file, it is opened.
   - If it includes a time limit and `show_timer = true`, the server sendes countdown `timer` messages.
      ```json
        {
          "message": "10",
          "message_type": "timer"
        }
      ```
   - If there is no timer, the client must confirm completion with message: `completed`

4. **Activity End**  
     - The server sends an `end` message.
        ```json
          {
            "activity_name": "Consent Form",
            "activity_num": 1,
            "message": "Thank you for completing this section.",
            "message_type": "end"
          }
        ```
     - The client must respond with: `next`

5. **Process Cleanup**  
     - If `close_activity = true`, the server closes any external processes tied to the activity.

6. **Completion**  
     - After the last activity, a `finish` message is sent and the WebSocket is closed.

> ⚠️ If at any point the client sends an invalid message (anything other than `start`, `completed`, or `next` where required), the server returns a `400 Bad Request` and may terminate the session.

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
