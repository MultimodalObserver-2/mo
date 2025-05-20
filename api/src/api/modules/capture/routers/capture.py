from fastapi import APIRouter, Depends

from api.core.plugin.plugin import PluginMetadata
from api.modules.capture.services.capture_service import CaptureService

capture_router = APIRouter(prefix="/capture", tags=["Capture"])


@capture_router.get(
    "/plugins",
    response_model=list[PluginMetadata],
    status_code=200,
    summary="Get Capture Plugins",
    description="Get all available capture plugins.",
)
async def get_capture_plugins(service: CaptureService = Depends()):
    return service.get_capture_plugins()
