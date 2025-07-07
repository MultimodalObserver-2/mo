from fastapi import APIRouter, Depends, Path, status

from mo.modules.organization.schemas.participant import (
    ParticipantPostReq,
    ParticipantPutReq,
    ParticipantRes,
)
from mo.modules.organization.services.participant_service import ParticipantService

participant_router = APIRouter(
    prefix="/projects/{project_name}/participants",
    tags=["participants"],
)

PROJECT_NAME_DESC = "Name of the project."
PARTICIPANT_CODE_DESC = "Code of the participant."


@participant_router.post(
    "/",
    response_model=ParticipantRes,
    summary="Create a participant",
    description="Add a new participant to a project.",
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "Participant already exists"},
        400: {"description": "Invalid participant code"},
        404: {"description": "Project not found"},
    },
)
async def create_participant(
    participant: ParticipantPostReq,
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ParticipantService = Depends(),
):
    return service.create_participant(project_name, participant)


@participant_router.get(
    "/",
    response_model=list[ParticipantRes],
    summary="Get all participants",
    description="Retrieve a list of all participants for a project.",
    responses={
        404: {"description": "Project not found"},
    },
)
async def get_all_participants(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    service: ParticipantService = Depends(),
):
    return service.get_all_participants(project_name)


@participant_router.put(
    "/{participant_code}",
    response_model=ParticipantRes,
    summary="Update a participant",
    description="Update an existing participant in a project.",
    responses={
        404: {"description": "Participant or project not found"},
        400: {"description": "Participant is locked or invalid new code"},
        409: {"description": "New participant code already exists"},
    },
)
async def update_participant(
    participant: ParticipantPutReq,
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    participant_code: str = Path(..., description=PARTICIPANT_CODE_DESC),
    service: ParticipantService = Depends(),
):
    return service.update_participant(project_name, participant_code, participant)


@participant_router.get(
    "/{participant_code}",
    response_model=ParticipantRes,
    summary="Get a participant",
    description="Retrieve details of a specific participant by code.",
    responses={
        404: {"description": "Participant or project not found"},
    },
)
async def get_participant(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    participant_code: str = Path(..., description=PARTICIPANT_CODE_DESC),
    service: ParticipantService = Depends(),
):
    return service.get_participant(project_name, participant_code)


@participant_router.get(
    "/byuuid/{participant_uuid}",
    response_model=ParticipantRes,
    summary="Get a participant by UUID",
    description="Retrieve details of a specific participant by UUID.",
    responses={
        404: {"description": "Participant or project not found"},
    },
)
async def get_participant_by_uuid(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    participant_uuid: str = Path(..., description="UUID of the participant to retrieve"),
    service: ParticipantService = Depends(),
):
    return service.get_participant_by_uuid(project_name, participant_uuid)


@participant_router.delete(
    "/{participant_code}",
    summary="Delete a participant",
    description="Delete a participant from a project.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"description": "Participant or project not found"},
        400: {"description": "Participant is locked"},
    },
)
async def delete_participant(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    participant_code: str = Path(..., description=PARTICIPANT_CODE_DESC),
    service: ParticipantService = Depends(),
):
    return service.delete_participant(project_name, participant_code)


@participant_router.post(
    "/{participant_code}/lock",
    response_model=ParticipantRes,
    summary="Lock a participant",
    description="Lock a participant to prevent modifications.",
    responses={
        404: {"description": "Participant or project not found"},
    },
)
async def lock_participant(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    participant_code: str = Path(..., description=PARTICIPANT_CODE_DESC),
    service: ParticipantService = Depends(),
):
    return service.lock_participant(project_name, participant_code)


@participant_router.post(
    "/{participant_code}/unlock",
    response_model=ParticipantRes,
    summary="Unlock a participant",
    description="Unlock a participant to allow modifications.",
    responses={
        404: {"description": "Participant or project not found"},
    },
)
async def unlock_participant(
    project_name: str = Path(..., description=PROJECT_NAME_DESC),
    participant_code: str = Path(..., description=PARTICIPANT_CODE_DESC),
    service: ParticipantService = Depends(),
):
    return service.unlock_participant(project_name, participant_code)
