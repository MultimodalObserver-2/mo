from fastapi import APIRouter, Depends, Request, UploadFile, status

from mo.core.api.schemas.plugin import PluginRes
from mo.core.api.services.plugin_service import PluginService
from mo.core.api.utils.query_params import parse_query_params

plugin_router = APIRouter(prefix="/plugins", tags=["plugins"])


@plugin_router.post(
    "/",
    response_model=PluginRes,
    summary="Register a new plugin from a zip file",
    description="Upload a zip file containing the plugin to register it in the system.",
    status_code=status.HTTP_201_CREATED,
    response_model_exclude_none=True,
    responses={
        400: {
            "description": "Invalid file format or plugin registration error",
        },
    },
)
async def add_plugin(file: UploadFile, service: PluginService = Depends()):
    return await service.add_plugin(file)


@plugin_router.put(
    "/{final_id}",
    response_model=PluginRes,
    summary="Update an installed plugin from a zip file",
    description="Upload a zip file containing a newer release of an already installed "
    "plugin to atomically replace it, keeping the same final ID.",
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
    responses={
        400: {
            "description": "Invalid file format or plugin update error",
        },
        404: {
            "description": "Plugin not found",
        },
    },
)
async def update_plugin(
    final_id: str, file: UploadFile, service: PluginService = Depends()
):
    return await service.update_plugin(final_id, file)


@plugin_router.get(
    "/",
    response_model=list[PluginRes],
    summary="Get all registered plugins",
    description="Retrieve a list of all registered plugins' metadata.",
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
)
async def get_all_plugins(service: PluginService = Depends()):
    return await service.get_all_plugins()


@plugin_router.get(
    "/{final_id}",
    response_model=PluginRes,
    summary="Get a specific plugin by ID",
    description="Retrieve metadata for a specific plugin using its final ID.",
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
    responses={
        404: {
            "description": "Plugin not found",
        },
    },
)
async def get_plugin(final_id: str, service: PluginService = Depends()):
    return service.get_plugin(final_id)


@plugin_router.delete(
    "/{final_id}",
    summary="Delete a plugin by ID",
    description="Remove a plugin from the system using its final ID.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {
            "description": "Plugin not found",
        },
        400: {
            "description": "Error during plugin removal",
        },
    },
)
async def delete_plugin(final_id: str, service: PluginService = Depends()):
    return await service.remove_plugin(final_id)


@plugin_router.get(
    "/{final_id}/settings/properties",
    summary="Get plugin properties",
    description="Retrieve properties of a specific plugin using its final ID. "
    "Query parameters can be used to filter the response based on specific settings.",
    status_code=status.HTTP_200_OK,
    response_model_exclude_none=True,
    responses={
        404: {
            "description": "Plugin not found",
        },
    },
)
async def get_plugin_properties(
    final_id: str, request: Request, service: PluginService = Depends()
):
    settings = parse_query_params(request)
    return service.get_plugin_properties(final_id, settings)
