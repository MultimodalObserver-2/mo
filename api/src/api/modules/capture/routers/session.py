
from api.modules.capture.services.session_service import SessionService
from fastapi import APIRouter, Depends


session_router = APIRouter(
    prefix="/projects/{project_name}/participants/{participant_code}/sessions",
    tags=["Session"],
)

@session_router.get(
    "/",
    summary="Get All Sessions",
    description="Retrieve all sessions for a specific participant in a project.",
)
async def get_all_sessions(project_name: str, participant_code: str, service: SessionService = Depends()):
    return service.get_all_sessions(project_name, participant_code)

@session_router.get(
    "/{session_id}",
    summary="Get Session by ID",
    description="Retrieve a specific session by its ID for a participant in a project.",
)
async def get_session_by_id(
    project_name: str, participant_code: str, session_id: str, service: SessionService = Depends()
):
    return service.get_session(project_name, participant_code, session_id)

@session_router.delete(
    "/{session_id}",
    summary="Delete Session",
    description="Delete a specific session by its ID for a participant in a project.",
)
async def delete_session(
    project_name: str, participant_code: str, session_id: str, service: SessionService = Depends()
):
    return service.delete_session(project_name, participant_code, session_id)
