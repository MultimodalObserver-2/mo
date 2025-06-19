from fastapi import APIRouter, Depends

from mo.modules.visualization.schemas.playback_config import (
    PlaybackConfigPostReq,
    PlaybackConfigPutReq,
    PlaybackConfigRes,
)
from mo.modules.visualization.services.playback_config import PlaybackConfigService

playback_config_router = APIRouter(
    prefix="/projects/{project_name}/playback/configs",
    tags=["projects", "playback", "configurations", "visualization"],
)


@playback_config_router.post(
    "/",
    response_model=PlaybackConfigRes,
    status_code=200,
    summary="Add playback configuration",
    description="Add new playback configuration for the specified project.",
    responses={
        409: {"description": "Playback configuration already exists"},
        400: {"description": "Invalid playback configuration"},
    },
)
async def add_capture_config(
    project_name: str, config: PlaybackConfigPostReq, service: PlaybackConfigService = Depends()
) -> PlaybackConfigRes:
    return service.add_capture_config(project_name, config)


@playback_config_router.get(
    "/",
    response_model=list[PlaybackConfigRes],
    status_code=200,
    summary="Get all playback configurations",
    description="Get all playback configurations for the specified project.",
)
async def get_all_capture_configs(
    project_name: str, service: PlaybackConfigService = Depends()
) -> list[PlaybackConfigRes]:
    return service.get_all_capture_configs(project_name)


@playback_config_router.get(
    "/{config_name}",
    response_model=PlaybackConfigRes,
    status_code=200,
    summary="Get playback configuration",
    description="Get playback configuration for the specified project.",
    responses={
        404: {"description": "Playback configuration not found"},
        400: {"description": "Invalid playback configuration"},
    },
)
async def get_capture_config(
    project_name: str, config_name: str, service: PlaybackConfigService = Depends()
) -> PlaybackConfigRes:
    return service.get_capture_config(project_name, config_name)


@playback_config_router.put(
    "/{config_name}",
    response_model=PlaybackConfigRes,
    status_code=200,
    summary="Update playback configuration",
    description="Update playback configuration for the specified project.",
    responses={
        404: {"description": "Playback configuration not found"},
        400: {"description": "Invalid playback configuration"},
        409: {"description": "Playback configuration already exists"},
    },
)
async def update_capture_config(
    project_name: str,
    config_name: str,
    config: PlaybackConfigPutReq,
    service: PlaybackConfigService = Depends(),
) -> PlaybackConfigRes:
    return service.update_capture_config(project_name, config_name, config)


@playback_config_router.delete(
    "/{config_name}",
    status_code=204,
    summary="Delete playback configuration",
    description="Delete playback configuration for the specified project.",
    responses={
        404: {"description": "Playback configuration not found"},
        400: {"description": "Invalid playback configuration name"},
    },
)
async def delete_capture_settings(
    project_name: str, config_name: str, service: PlaybackConfigService = Depends()
) -> None:
    return service.delete_capture_config(project_name, config_name)
