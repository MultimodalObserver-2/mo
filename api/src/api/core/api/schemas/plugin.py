import os
from typing import Optional
from api.core.plugin.plugin import PluginMetadata
from pydantic import BaseModel


class PlatformsRes(BaseModel):
    linux: bool = False
    windows: bool = False
    mac: bool = False


class PluginRes(BaseModel):
    name: str
    version: str
    description: str
    repository: str
    icon_path: str = ""
    author: Optional[str] = None
    author_email: Optional[str] = None
    platforms: PlatformsRes
    location: str
    module: Optional[str] = None
    error: Optional[str] = None
    is_loaded: bool = False

    @staticmethod
    def from_plugin_metadata(plugin_metadata: PluginMetadata):
        return PluginRes(
            name=plugin_metadata.name,
            version=str(plugin_metadata.version),
            description=plugin_metadata.description,
            icon_path=(
                os.path.join(plugin_metadata._location or "",
                             plugin_metadata.icon_path or "")
                if plugin_metadata.icon_path
                else ""
            ),
            repository=plugin_metadata.repository,
            author=plugin_metadata.author,
            author_email=plugin_metadata.author_email,
            platforms=PlatformsRes(
                linux=plugin_metadata.platform.linux,
                windows=plugin_metadata.platform.windows,
                mac=plugin_metadata.platform.mac,
            ),
            module=plugin_metadata._module,
            location=plugin_metadata._location or "",
            error=plugin_metadata._error,
            is_loaded=plugin_metadata._is_loaded,
        )
