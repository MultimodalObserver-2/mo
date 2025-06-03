from typing import Any, Optional

from api.core.plugin.plugin import PluginIcons, PluginMetadata
from pydantic import BaseModel


class SettingsPostReq(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class SettingsPutReq(BaseModel):
    name: str
    settings: dict[str, Any]


class SettingsRes(BaseModel):
    name: str
    plugin_id: str
    plugin_icon: Optional[str] | Optional[PluginIcons] = None
    plugin_is_loaded: bool = False
    settings: dict[str, Any]


class SettingsData(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class SettingsLoaded(BaseModel):
    name: str
    plugin_id: str
    plugin_metadata: PluginMetadata
    settings: dict[str, Any]
