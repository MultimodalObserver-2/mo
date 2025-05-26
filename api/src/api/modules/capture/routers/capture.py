from api.core.api.schemas.plugin import PluginRes
from api.modules.capture.schemas.capture import CaptureStartRequest
from fastapi import APIRouter, Depends

from api.modules.capture.services.capture_service import CaptureService

capture_router = APIRouter(prefix="/capture", tags=["Capture"])


def get_capture_service() -> CaptureService:
    return CaptureService()

@capture_router.get(
    "/plugins",
    response_model=list[PluginRes],
    status_code=200,
    summary="Get Capture Plugins",
    description="Get all available capture plugins.",
)
async def get_capture_plugins(service: CaptureService = Depends(get_capture_service)) -> list[PluginRes]:
    return service.get_capture_plugins()

@capture_router.post(
    "/start",
    status_code=204,
    summary="Start Capture",
    description="Start the capture process for a participant in a project.",
)
async def start_capture(
    capture_start_request: CaptureStartRequest,
    service: CaptureService = Depends(get_capture_service),
) -> None:
    service.start_capture(capture_start_request.project_name,
                          capture_start_request.participant_code)
    return None

@capture_router.post(
    "/stop",
    status_code=204,
    summary="Stop Capture",
    description="Stop the capture process.",
)
async def stop_capture(service: CaptureService = Depends(get_capture_service)) -> None:
    service.stop_capture()
    return None

@capture_router.get(
    "/status",
    status_code=200,
    summary="Get Capture Status",
    description="Get the current status of the capture process.",
)
async def get_status(service: CaptureService = Depends(get_capture_service)) -> bool:
    # TODO: Add pause and resume status
    return service.is_capturing()