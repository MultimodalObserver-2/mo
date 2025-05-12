
from api.core.plugin.schemas.plugin import PluginRes
from api.core.plugin.services.plugin_service import PluginService
from fastapi import APIRouter, Depends, UploadFile, status


plugin_router = APIRouter(
    prefix="/plugins",
    tags=["plugins"]
)

@plugin_router.post("/", response_model=PluginRes, status_code=status.HTTP_201_CREATED)
async def add_plugin(file: UploadFile, service: PluginService = Depends()):
    return service.add_plugin(file)
