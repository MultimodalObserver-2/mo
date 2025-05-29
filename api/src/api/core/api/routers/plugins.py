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
    "/{final_id}",
    response_model=PluginRes,
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
)
async def get_plugin(final_id: str, service: PluginService = Depends()):
    return service.get_plugin(final_id)


@plugin_router.delete("/{final_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plugin(final_id: str, service: PluginService = Depends()):
    return service.remove_plugin(final_id)


@plugin_router.get(
    "/{final_id}/settings/properties",
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
)
async def get_plugin_properties(
    final_id: str, request: Request, service: PluginService = Depends()
):
    settings = parse_query_params(request)
    return service.get_plugin_properties(final_id, settings)
