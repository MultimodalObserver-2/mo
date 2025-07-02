<!-- omit in toc -->
# 📚 API Documentation

This document contains the HTTP API reference for the **Multimodal Observer** application.

The API is organized in **modules** to reflect the modular and extensible architecture of the platform. Each module is responsible for a set of related operations.

📌 While the API is in development, the full interactive documentation is available at:

- [Swagger (/docs)](http://localhost:8000/docs)
- [ReDoc (/redoc)](http://localhost:8000/redoc)

These endpoints provide up-to-date details including request/response schemas, example payloads, and status codes.

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
```

---

## 📑 Available API Docs

Each module has its own documentation file, detailing the endpoints, request/response and formats.

Select a module or the core endpoints to explore:

- [⚙️ Core Endpoints](core.md)
- [📦 Organization Module](organization.md)
- [🎥 Capture Module](capture.md)
- [🖼️ Visualization Module](visualization.md)
