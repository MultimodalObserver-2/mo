from api.modules.organization.schemas.protocol import ProtocolPostReq
from api.modules.organization.services.protocol_service import ProtocolService
from fastapi import APIRouter, Depends, Path, status


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
