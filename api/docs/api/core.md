<!-- omit in toc -->
# ⚙️ Core API Endpoints

This section provides an overview of the core API endpoints available in the Multimodal Observer application.

<!-- omit in toc -->
## 📑 Table of Contents
- [🧩 Plugins](#-plugins)

## 🧩 Plugins

| Method   | Route                                     | Description                                        | Responses                                                                |
| -------- | ----------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------ |
| `GET`    | `/plugins/`                               | Get all registered plugins' metadata.              | 200 OK                                                                   |
| `POST`   | `/plugins/`                               | Register a new plugin from a zip file.             | 201 Created, 400 Bad Request, 422 Unprocessable Entity                   |
| `GET`    | `/plugins/{final_id}`                     | Get a specific plugin by ID.                       | 200 OK, 404 Not Found, 422 Unprocessable Entity                          |
| `DELETE` | `/plugins/{final_id}`                     | Delete a plugin by ID.                             | 204 No Content, 400 Bad Request, 404 Not Found, 422 Unprocessable Entity |
| `GET`    | `/plugins/{final_id}/settings/properties` | Get plugin properties. Optional filters via query. | 200 OK, 404 Not Found, 422 Unprocessable Entity                          |
