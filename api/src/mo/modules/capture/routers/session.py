from fastapi import APIRouter, Depends

from mo.modules.capture.schemas.session import SessionRes
from mo.modules.capture.services.session_service import SessionService

session_router = APIRouter(
    prefix="/projects/{project_name}/participants/{participant_code}/sessions",
    tags=["session"],
)


@session_router.get(
    "/",
    response_model=list[SessionRes],
    summary="Get All Sessions",
    description="Retrieve all sessions for a specific participant in a project.",
)
async def get_all_sessions(
    project_name: str, participant_code: str, service: SessionService = Depends()
) -> list[SessionRes]:
    return service.get_all_sessions(project_name, participant_code)


@session_router.get(
    "/{session_id}",
    response_model=SessionRes,
    summary="Get Session by ID",
    description="Retrieve a specific session by its ID for a participant in a project.",
    responses={
        404: {"description": "Session not found"},
        400: {"description": "Invalid session ID"},
    },
)
async def get_session_by_id(
    project_name: str, participant_code: str, session_id: str, service: SessionService = Depends()
) -> SessionRes:
    return service.get_session(project_name, participant_code, session_id)


@session_router.delete(
    "/{session_id}",
    summary="Delete Session",
    description="Delete a specific session by its ID for a participant in a project.",
    status_code=204,
    responses={
        404: {"description": "Session not found"},
        400: {"description": "Invalid session ID"},
    },
)
async def delete_session(
    project_name: str, participant_code: str, session_id: str, service: SessionService = Depends()
):
    return await service.delete_session(project_name, participant_code, session_id)
