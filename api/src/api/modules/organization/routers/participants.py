from fastapi import APIRouter, Depends

from api.modules.organization.schemas.participant import (ParticipantPostReq,
                                                          ParticipantRes)
from api.modules.organization.services.participant_service import \
    ParticipantService

participant_router = APIRouter(
    prefix="/projects/{project_name}/participants",
    tags=["participants"],
)


@participant_router.post(
    "/", response_model=ParticipantRes, description="Add a new participant to a project."
)
async def create_participant(
    project_name: str, participant: ParticipantPostReq, service: ParticipantService = Depends()
):
    return service.create_participant(project_name, participant)


@participant_router.get(
    "/", response_model=list[ParticipantRes], description="Get all participants of a project."
)
async def get_all_participants(project_name: str, service: ParticipantService = Depends()):
    return service.get_all_participants(project_name)
