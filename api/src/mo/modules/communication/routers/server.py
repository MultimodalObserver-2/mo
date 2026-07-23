import json
from pathlib import Path

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from mo.modules.communication.schemas.server import NotesPathRequest, ServerConfig, ServerStatus
from mo.modules.communication.services.server_service import ServerService

server_router = APIRouter(prefix="/communication/server", tags=["communication"])


def get_server_service() -> ServerService:
    return ServerService()


@server_router.post(
    "/start",
    status_code=204,
    summary="Start Communication Server",
    description="Start the TCP and UDP servers with the given port configuration.",
    responses={
        400: {"description": "Server is already online"},
    },
)
async def start_server(
    config: ServerConfig,
    service: ServerService = Depends(get_server_service),
) -> None:
    return await service.start_server(config)


@server_router.post(
    "/stop",
    status_code=204,
    summary="Stop Communication Server",
    description="Stop the TCP and UDP servers and disconnect all clients.",
    responses={
        400: {"description": "Server is not online"},
    },
)
async def stop_server(service: ServerService = Depends(get_server_service)) -> None:
    return await service.stop_server()


@server_router.get(
    "/status",
    response_model=ServerStatus,
    status_code=200,
    summary="Get Server Status",
    description="Return whether the server is online, the local IP, ports and connected clients.",
)
async def get_status(service: ServerService = Depends(get_server_service)) -> ServerStatus:
    return service.get_status()


@server_router.post(
    "/direct-devices",
    status_code=204,
    summary="Configure Direct Devices",
    description="Set the direct device configuration sent to each client on connect.",
)
async def configure_direct_devices(
    config: dict,
    service: ServerService = Depends(get_server_service),
) -> None:
    return service.configure_direct_devices(config)


@server_router.post(
    "/notes-path",
    status_code=204,
    summary="Set Notes File Path",
    description="Set the file path where received notes are persisted.",
)
async def set_notes_path(
    request: NotesPathRequest,
    service: ServerService = Depends(get_server_service),
) -> None:
    return service.set_notes_path(Path(request.path))


@server_router.websocket("/ws")
async def websocket_events(
    websocket: WebSocket,
    service: ServerService = Depends(get_server_service),
) -> None:
    await websocket.accept()
    queue = service.subscribe_ws()
    try:
        while True:
            event = await queue.get()
            await websocket.send_text(json.dumps(event))
    except WebSocketDisconnect:
        pass
    finally:
        service.unsubscribe_ws(queue)
