from fastapi import APIRouter, Depends

from mo.modules.capture.schemas.capture_config import (
    CaptureConfigPostReq,
    CaptureConfigPutReq,
    CaptureConfigRes,
)
from mo.modules.capture.services.config_service import CaptureConfigService

capture_config_router = APIRouter(
    prefix="/projects/{project_name}/capture/configs",
    tags=["capture", "configurations"],
)


@capture_config_router.post(
    "/",
    response_model=CaptureConfigRes,
    status_code=200,
    summary="Add capture configuration",
    description="Add new capture configuration for the specified project.",
    responses={
        409: {"description": "Capture configuration already exists"},
        400: {"description": "Invalid capture configuration"},
    },
)
async def add_capture_config(
    project_name: str, config: CaptureConfigPostReq, service: CaptureConfigService = Depends()
) -> CaptureConfigRes:
    return service.add_capture_config(project_name, config)


@capture_config_router.get(
    "/",
    response_model=list[CaptureConfigRes],
    status_code=200,
    summary="Get all capture configurations",
    description="Get all capture settings for the specified project.",
)
async def get_all_capture_configs(
    project_name: str, service: CaptureConfigService = Depends()
) -> list[CaptureConfigRes]:
    return service.get_all_capture_configs(project_name)


@capture_config_router.get(
    "/{config_name}",
    response_model=CaptureConfigRes,
    status_code=200,
    summary="Get capture configuration",
    description="Get capture configuration for the specified project.",
    responses={
        404: {"description": "Capture configuration not found"},
        400: {"description": "Invalid capture configuration name"},
    },
)
async def get_capture_config(
    project_name: str, config_name: str, service: CaptureConfigService = Depends()
) -> CaptureConfigRes:
    return service.get_capture_config(project_name, config_name)


@capture_config_router.put(
    "/{config_name}",
    response_model=CaptureConfigRes,
    status_code=200,
    summary="Update capture configuration",
    description="Update capture configuration for the specified project.",
    responses={
        404: {"description": "Capture configuration not found"},
        400: {"description": "Invalid capture configuration"},
        409: {"description": "Capture configuration already exists"},
    },
)
async def update_capture_config(
    project_name: str,
    config_name: str,
    config: CaptureConfigPutReq,
    service: CaptureConfigService = Depends(),
) -> CaptureConfigRes:
    return service.update_capture_config(project_name, config_name, config)


@capture_config_router.delete(
    "/{config_name}",
    status_code=204,
    summary="Delete capture configuration",
    description="Delete capture configuration for the specified project.",
    responses={
        404: {"description": "Capture configuration not found"},
        400: {"description": "Invalid capture configuration name"},
    },
)
async def delete_capture_settings(
    project_name: str, config_name: str, service: CaptureConfigService = Depends()
) -> None:
    return service.delete_capture_config(project_name, config_name)
