from typing import Any, Optional

from pydantic import BaseModel

from mo.core.plugin.models.plugin import PluginIcons, PluginMetadata


class CaptureConfigPostReq(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class CaptureConfigPutReq(BaseModel):
    name: str
    settings: dict[str, Any]


class CaptureConfigRes(BaseModel):
    name: str
    plugin_id: str
    plugin_icon: Optional[str] | Optional[PluginIcons] = None
    plugin_is_loaded: bool = False
    settings: dict[str, Any]


class CaptureConfigData(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class CaptureConfigLoaded(BaseModel):
    name: str
    plugin_id: str
    plugin_metadata: PluginMetadata
    settings: dict[str, Any]
