from fastapi import APIRouter, Depends

from api.modules.capture.schemas.settings import SettingsPostReq, SettingsRes
from api.modules.capture.services.setting_service import CaptureSettingService

capture_settings_router = APIRouter(
    prefix="/projects/{project_name}/capture/settings",
    tags=["capture_settings"],
)


@capture_settings_router.post(
    "/",
    response_model=SettingsRes,
    status_code=200,
    summary="Add capture settings",
    description="Add new capture settings for the specified project.",
)
async def add_capture_settings(
    project_name: str, settings: SettingsPostReq, service: CaptureSettingService = Depends()
) -> SettingsRes:
    return service.add_capture_settings(project_name, settings)

@capture_settings_router.get(
    "/",
    response_model=list[SettingsRes],
    status_code=200,
    summary="Get all capture settings",
    description="Get all capture settings for the specified project.",
)
async def get_all_capture_settings(
    project_name: str, service: CaptureSettingService = Depends()
) -> list[SettingsRes]:
    return service.get_all_capture_settings(project_name)

@capture_settings_router.delete(
    "/{setting_name}",
    status_code=204,
    summary="Delete capture settings",
    description="Delete capture settings for the specified project."
)
async def delete_capture_settings(
    project_name: str,
    setting_name: str,
    service: CaptureSettingService = Depends()
) -> None:
    service.delete_capture_settings(project_name, setting_name)
