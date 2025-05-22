from typing import Any

from api.core.plugin.plugin import PluginIcons
from pydantic import BaseModel


class SettingsPostReq(BaseModel):
    name: str
    plugin_name: str
    settings: dict[str, Any]


class SettingsPutReq(BaseModel):
    settings: dict[str, Any]


class SettingsRes(BaseModel):
    name: str
    plugin_name: str
    plugin_icon: str | PluginIcons
    settings: dict[str, Any]
