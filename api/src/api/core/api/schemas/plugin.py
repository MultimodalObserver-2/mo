import os
from typing import Any, Optional

from pydantic import BaseModel

from api.core.plugin.plugin import PluginIcons, PluginMetadata
from api.core.plugin.properties import Property, PropertyType


class PlatformsRes(BaseModel):
    linux: bool = False
    windows: bool = False
    mac: bool = False


class PluginRes(BaseModel):
    name: str
    version: str
    description: str
    repository: str
    icon_path: str | PluginIcons = ""
    author: Optional[str] = None
    author_email: Optional[str] = None
    platforms: PlatformsRes
    location: str
    module: Optional[str] = None
    error: Optional[str] = None
    is_loaded: bool = False

    @staticmethod
    def get_icon_path(location: str = "", icon_path: str | PluginIcons = "") -> str | PluginIcons:
        if isinstance(icon_path, str):
            return os.path.join(location, icon_path)
        elif isinstance(icon_path, PluginIcons):
            return PluginIcons(**{
                "dark": os.path.join(location, icon_path.dark or ""),
                "light": os.path.join(location, icon_path.light or ""),
            })
        return ""

    @staticmethod
    def from_plugin_metadata(plugin_metadata: PluginMetadata):
        return PluginRes(
            name=plugin_metadata.name,
            version=str(plugin_metadata.version),
            description=plugin_metadata.description,
            icon_path=PluginRes.get_icon_path(plugin_metadata._location or "",
                                              plugin_metadata.icon_path or ""
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


class PropertyRes(BaseModel):
    key: str
    label: str
    required: bool = True
    visible: bool = True
    enabled: bool = True
    default: Optional[Any] = None
    data: dict[str, Any] = {}
    property_type: PropertyType
    reactive: bool = False

    @staticmethod
    def from_property(prop: Property):
        return PropertyRes(
            key=prop.key,
            label=prop.label,
            required=prop.required,
            visible=prop.visible,
            enabled=prop.enabled,
            default=prop.default,
            data=prop.data,
            property_type=prop._type,
            reactive=prop._modified_callback is not None,
        )
