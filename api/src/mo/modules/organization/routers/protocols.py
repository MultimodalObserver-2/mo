from fastapi import APIRouter, Depends, Path, WebSocket, status

from mo.modules.organization.schemas.protocol import ProtocolPostReq, ProtocolPutReq, ProtocolRes
from mo.modules.organization.services.protocol_exec_service import ProtocolExecService
from mo.modules.organization.services.protocol_service import ProtocolService

protocols_router = APIRouter(
    prefix="/projects/{project_name}/protocols",
    tags=["protocols"],
)

PROJECT_NAME_DESC = "Name of the project."
PROTOCOL_NAME_DESC = "Name of the protocol."


@protocols_router.post(
    "/",
    response_model=ProtocolRes,
    summary="Create a protocol",
    description="Add a new protocol to a project.",
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "Protocol already exists"},
        400: {"description": "Invalid protocol data"},
        404: {"description": "Project not found"},
    },
)
async def create_protocol(
    protocol: ProtocolPostReq,
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ProtocolService = Depends(),
):
    return service.create_protocol(project_name, protocol)


@protocols_router.get(
    "/",
    response_model=list[ProtocolRes],
    summary="Get all protocols",
    description="Retrieve a list of all protocols for a project.",
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Project not found"},
    },
)
async def get_all_protocols(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ProtocolService = Depends(),
):
    return service.get_all_protocols(project_name)


@protocols_router.get(
    "/{protocol_name}",
    response_model=ProtocolRes,
    summary="Get a protocol",
    description="Retrieve details of a specific protocol by name.",
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Protocol not found"},
        400: {"description": "Protocol is locked"},
    },
)
async def get_protocol(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    protocol_name: str = Path(..., description=PROTOCOL_NAME_DESC),
    service: ProtocolService = Depends(),
):
    return service.get_protocol(project_name, protocol_name)


@protocols_router.get(
    "/byuuid/{protocol_uuid}",
    response_model=ProtocolRes,
    summary="Get a protocol by UUID",
    description="Retrieve details of a specific protocol by UUID.",
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Protocol not found"},
        400: {"description": "Protocol is locked"},
    },
)
async def get_protocol_by_uuid(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    protocol_uuid: str = Path(..., description="UUID of the protocol"),
    service: ProtocolService = Depends(),
):
    return service.get_protocol_by_uuid(project_name, protocol_uuid)


@protocols_router.put(
    "/{protocol_name}",
    response_model=ProtocolRes,
    summary="Update a protocol",
    description="Modify an existing protocol.",
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Protocol not found"},
        400: {"description": "Protocol is locked or invalid data"},
        409: {"description": "New protocol name already exists"},
    },
)
async def update_protocol(
    protocol: ProtocolPutReq,
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    protocol_name: str = Path(..., description=PROTOCOL_NAME_DESC),
    service: ProtocolService = Depends(),
):
    return service.update_protocol(project_name, protocol_name, protocol)


@protocols_router.delete(
    "/{protocol_name}",
    response_model=None,
    summary="Delete a protocol",
    description="Remove a protocol from a project.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"description": "Protocol not found"},
        400: {"description": "Protocol is locked"},
    },
)
async def delete_protocol(
    protocol_name: str = Path(..., description=PROTOCOL_NAME_DESC),
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ProtocolService = Depends(),
):
    return service.delete_protocol(project_name, protocol_name)


@protocols_router.post(
    "/{protocol_name}/lock",
    response_model=ProtocolRes,
    summary="Lock a protocol",
    description="Prevent modifications to a protocol.",
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Protocol not found"},
        400: {"description": "Protocol is already locked"},
    },
)
async def lock_protocol(
    protocol_name: str = Path(..., description=PROTOCOL_NAME_DESC),
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ProtocolService = Depends(),
):
    return service.lock_protocol(project_name, protocol_name)


@protocols_router.post(
    "/{protocol_name}/unlock",
    response_model=ProtocolRes,
    summary="Unlock a protocol",
    description="Allow modifications to a protocol.",
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Protocol not found"},
        400: {"description": "Protocol is already unlocked"},
    },
)
async def unlock_protocol(
    protocol_name: str = Path(..., description=PROTOCOL_NAME_DESC),
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ProtocolService = Depends(),
):
    return service.unlock_protocol(project_name, protocol_name)


@protocols_router.websocket("/{protocol_name}/execute")
async def websocket_protocol(
    websocket: WebSocket,
    protocol_name: str = Path(..., description=PROTOCOL_NAME_DESC),
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ProtocolExecService = Depends(),
):
    await websocket.accept()
    await service.run(websocket, protocol_name, project_name)
    await websocket.close()
