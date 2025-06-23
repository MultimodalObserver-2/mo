from fastapi import APIRouter, Depends

from mo.modules.visualization.schemas.playback_config import (
    PlaybackConfigPostReq,
    PlaybackConfigPutReq,
    PlaybackConfigRes,
)
from mo.modules.visualization.services.playback_config import PlaybackConfigService

playback_config_router = APIRouter(
    prefix="/projects/{project_name}/playback",
    tags=["projects", "playback", "configurations", "visualization"],
)


@playback_config_router.post(
    "/configs",
    response_model=PlaybackConfigRes,
    status_code=200,
    summary="Add playback configuration",
    description="Add new playback configuration for the specified project.",
    responses={
        409: {"description": "Playback configuration already exists"},
        400: {"description": "Invalid playback configuration"},
    },
)
async def add_playback_config(
    project_name: str, config: PlaybackConfigPostReq, service: PlaybackConfigService = Depends()
) -> PlaybackConfigRes:
    return service.add_playback_config(project_name, config)


@playback_config_router.get(
    "/configs",
    response_model=list[PlaybackConfigRes],
    status_code=200,
    summary="Get all playback configurations",
    description="Get all playback configurations for the specified project.",
)
async def get_all_playback_configs(
    project_name: str, service: PlaybackConfigService = Depends()
) -> list[PlaybackConfigRes]:
    return service.get_all_playback_configs(project_name)


@playback_config_router.get(
    "/configs/{config_name}",
    response_model=PlaybackConfigRes,
    status_code=200,
    summary="Get playback configuration",
    description="Get playback configuration for the specified project.",
    responses={
        404: {"description": "Playback configuration not found"},
        400: {"description": "Invalid playback configuration"},
    },
)
async def get_playback_config(
    project_name: str, config_name: str, service: PlaybackConfigService = Depends()
) -> PlaybackConfigRes:
    return service.get_playback_config(project_name, config_name)


@playback_config_router.put(
    "/configs/{config_name}",
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
async def update_playback_config(
    project_name: str,
    config_name: str,
    config: PlaybackConfigPutReq,
    service: PlaybackConfigService = Depends(),
) -> PlaybackConfigRes:
    return service.update_playback_config(project_name, config_name, config)


@playback_config_router.delete(
    "/configs/{config_name}",
    status_code=204,
    summary="Delete playback configuration",
    description="Delete playback configuration for the specified project.",
    responses={
        404: {"description": "Playback configuration not found"},
        400: {"description": "Invalid playback configuration name"},
    },
)
async def delete_playback_settings(
    project_name: str, config_name: str, service: PlaybackConfigService = Depends()
) -> None:
    return service.delete_playback_config(project_name, config_name)


@playback_config_router.post(
    "/layout",
    status_code=200,
    summary="Save playback layout",
    description="Save playback layout for the specified project.",
    responses={
        400: {"description": "No serializable layout provided"},
        404: {"description": "Project not found"},
    },
)
async def save_playback_layout(
    project_name: str,
    layout: dict,
    service: PlaybackConfigService = Depends(),
) -> None:
    return service.save_playback_layout(project_name, layout)

@playback_config_router.get(
    "/layout",
    status_code=200,
    summary="Get playback layout",
    description="Get playback layout for the specified project.",
    responses={
        404: {"description": "Project not found"},
    },
)
async def get_playback_layout(
    project_name: str,
    service: PlaybackConfigService = Depends()
) -> dict:
    return service.get_playback_layout(project_name)
