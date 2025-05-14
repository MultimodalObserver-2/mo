from fastapi import APIRouter, Depends, UploadFile, status

from api.core.plugin.schemas.plugin import PluginRes
from api.core.plugin.services.plugin_service import PluginService

plugin_router = APIRouter(prefix="/plugins", tags=["plugins"])


@plugin_router.post("/", response_model=PluginRes, status_code=status.HTTP_201_CREATED)
async def add_plugin(file: UploadFile, service: PluginService = Depends()):
    return service.add_plugin(file)


@plugin_router.get("/", response_model=list[PluginRes], status_code=status.HTTP_200_OK)
async def get_all_plugins(service: PluginService = Depends()):
    return service.get_all_plugins()


@plugin_router.get(
    "/{plugin_name}/{plugin_version}", response_model=PluginRes, status_code=status.HTTP_200_OK
)
async def get_plugin(plugin_name: str, plugin_version: str, service: PluginService = Depends()):
    return service.get_plugin(plugin_name, plugin_version)


@plugin_router.delete("/{plugin_name}/{plugin_version}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plugin(plugin_name: str, plugin_version: str, service: PluginService = Depends()):
    return service.remove_plugin(plugin_name, plugin_version)
