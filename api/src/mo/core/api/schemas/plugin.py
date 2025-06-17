import os
from typing import Any, Optional

from pydantic import BaseModel

from mo.core.plugin.models.plugin import PluginIcons, PluginMetadata
from mo.core.plugin.models.properties import Property, PropertyType


class PlatformsRes(BaseModel):
    linux: bool = False
    windows: bool = False
    mac: bool = False


class AuthorRes(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class PublisherRes(BaseModel):
    name: str
    url: Optional[str] = None


class PluginRes(BaseModel):
    id: str
    name: str
    description: str
    version: str
    publisher: PublisherRes
    repository: str
    icon_path: str | PluginIcons = ""
    author: Optional[AuthorRes] = None
    platforms: PlatformsRes
    location: str
    target: str = "api"
    module: Optional[str] = None
    error: Optional[str] = None
    is_loaded: bool = False

    @staticmethod
    def get_icon_path(location: str = "", icon_path: str | PluginIcons = "") -> str | PluginIcons:
        if isinstance(icon_path, str):
            return os.path.join(location, icon_path)
        elif isinstance(icon_path, PluginIcons):
            return PluginIcons(
                **{
                    "dark": os.path.join(location, icon_path.dark or ""),
                    "light": os.path.join(location, icon_path.light or ""),
                }
            )
        return ""

    @staticmethod
    def from_plugin_metadata(plugin_metadata: PluginMetadata):
        return PluginRes(
            id=plugin_metadata.get_final_id(),
            name=plugin_metadata.name,
            description=plugin_metadata.description,
            version=str(plugin_metadata.version),
            publisher=PublisherRes(
                name=plugin_metadata.publisher.name,
                url=plugin_metadata.publisher.url,
            ),
            repository=plugin_metadata.repository,
            icon_path=PluginRes.get_icon_path(
                plugin_metadata._location or "", plugin_metadata.icon_path or ""
            ),
            author=(
                AuthorRes(
                    name=plugin_metadata.author.name,
                    email=plugin_metadata.author.email,
                )
                if plugin_metadata.author
                else None
            ),
            platforms=PlatformsRes(
                linux=plugin_metadata.platform.linux,
                windows=plugin_metadata.platform.windows,
                mac=plugin_metadata.platform.mac,
            ),
            target=plugin_metadata.target,
            location=plugin_metadata._location or "",
            module=plugin_metadata._module,
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
