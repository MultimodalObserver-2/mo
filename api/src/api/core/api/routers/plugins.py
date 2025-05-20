from fastapi import APIRouter, Depends, Request, UploadFile, status

from api.core.api.schemas.plugin import PluginRes
from api.core.api.services.plugin_service import PluginService
from api.core.api.utils.query_params import parse_query_params

plugin_router = APIRouter(prefix="/plugins", tags=["plugins"])


@plugin_router.post(
    "/",
    response_model=PluginRes,
    status_code=status.HTTP_201_CREATED,
    response_model_exclude_none=True,
)
async def add_plugin(file: UploadFile, service: PluginService = Depends()):
    return service.add_plugin(file)


@plugin_router.get(
    "/",
    response_model=list[PluginRes],
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
)
async def get_all_plugins(service: PluginService = Depends()):
    return service.get_all_plugins()


@plugin_router.get(
    "/{plugin_name}",
    response_model=PluginRes,
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
)
async def get_plugin(plugin_name: str, service: PluginService = Depends()):
    return service.get_plugin(plugin_name)


@plugin_router.delete("/{plugin_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plugin(plugin_name: str, service: PluginService = Depends()):
    return service.remove_plugin(plugin_name)


@plugin_router.get(
    "/{plugin_name}/settings/properties",
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
)
async def get_plugin_properties(
    plugin_name: str, request: Request, service: PluginService = Depends()
):
    settings = parse_query_params(request)
    return service.get_plugin_properties(plugin_name, settings)
