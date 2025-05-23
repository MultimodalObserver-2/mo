from typing import Any, Optional

from api.core.plugin.plugin import PluginIcons
from pydantic import BaseModel


class SettingsPostReq(BaseModel):
    name: str
    plugin_name: str
    settings: dict[str, Any]


class SettingsPutReq(BaseModel):
    name: str
    settings: dict[str, Any]


class SettingsRes(BaseModel):
    name: str
    plugin_name: str
    plugin_icon: Optional[str] | Optional[PluginIcons] = None
    plugin_is_loaded: bool = False
    settings: dict[str, Any]


class SettingsData(BaseModel):
    name: str
    plugin_name: str
    settings: dict[str, Any]
