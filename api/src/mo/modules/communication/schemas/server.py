from pydantic import BaseModel, Field


class NotesPathRequest(BaseModel):
    path: str


class ServerConfig(BaseModel):
    port_tcp: int = Field(default=4444, ge=1024, le=65535)
    port_udp: int = Field(default=5555, ge=1024, le=65535)


class ClientInfo(BaseModel):
    id: str
    ip: str
    capture_plugins: list[str] = []


class ServerStatus(BaseModel):
    online: bool
    is_streaming: bool = False
    local_ip: str | None = None
    port_tcp: int | None = None
    port_udp: int | None = None
    clients: list[ClientInfo] = []
