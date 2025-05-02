from fastapi import APIRouter, Depends, Path, status

from api.modules.organization.schemas.protocol import ProtocolPostReq
from api.modules.organization.services.protocol_service import ProtocolService

protocols_router = APIRouter(
    prefix="/projects/{project_name}/protocols",
    tags=["protocols"],
)


@protocols_router.post(
    "/",
    response_model=None,
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
    project_name: str = Path(..., description="Name of the project"),
    service: ProtocolService = Depends(),
):
    return service.create_protocol(project_name, protocol)


@protocols_router.get(
    "/",
    response_model=None,
    summary="Get all protocols",
    description="Retrieve a list of all protocols for a project.",
    status_code=status.HTTP_200_OK,
    responses={
        404: {"description": "Project not found"},
    },
)
async def get_all_protocols(
    project_name: str = Path(..., description="Name of the project"),
    service: ProtocolService = Depends(),
):
    return service.get_all_protocols(project_name)


@protocols_router.delete(
    "/{protocol_name}",
    response_model=None,
    summary="Delete a protocol",
    description="Remove a protocol from a project.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"description": "Protocol not found"},
        400: {"description": "Protocol is locked"},
    }
)
async def delete_protocol(
    protocol_name: str = Path(..., description="Name of the protocol"),
    project_name: str = Path(..., description="Name of the project"),
    service: ProtocolService = Depends(),
):
    return service.delete_protocol(project_name, protocol_name)
