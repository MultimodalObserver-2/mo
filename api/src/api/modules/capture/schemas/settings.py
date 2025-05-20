from typing import Any

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
    settings: dict[str, Any]
