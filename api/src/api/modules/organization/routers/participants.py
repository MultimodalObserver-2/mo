from fastapi import APIRouter, Depends, status

from api.modules.organization.schemas.participant import (ParticipantPostReq,
                                                          ParticipantPutReq,
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


@participant_router.put(
    "/{participant_code}",
    response_model=ParticipantRes,
    description="Update a project participant.",
)
async def update_participant(
    project_name: str,
    participant_code: str,
    participant: ParticipantPutReq,
    service: ParticipantService = Depends(),
):
    return service.update_participant(project_name, participant_code, participant)


@participant_router.get(
    "/{participant_code}", response_model=ParticipantRes, description="Get a project participant."
)
async def get_participant(
    project_name: str, participant_code: str, service: ParticipantService = Depends()
):
    return service.get_participant(project_name, participant_code)


@participant_router.delete(
    "/{participant_code}",
    description="Delete a project participant.",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_participant(
    project_name: str, participant_code: str, service: ParticipantService = Depends()
):
    return service.delete_participant(project_name, participant_code)

@participant_router.post(
    "/{participant_code}/lock",
    response_model=ParticipantRes,
    description="Lock a project participant.",
)
async def lock_participant(
    project_name: str, participant_code: str, service: ParticipantService = Depends()
):
    return service.lock_participant(project_name, participant_code)

@participant_router.post(
    "/{participant_code}/unlock",
    response_model=ParticipantRes,
    description="Unlock a project participant.",
)
async def unlock_participant(
    project_name: str, participant_code: str, service: ParticipantService = Depends()
):
    return service.unlock_participant(project_name, participant_code)
