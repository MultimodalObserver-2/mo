from typing import Any, Optional
import uuid

from pydantic import BaseModel, Field

from mo.core.plugin.models.plugin import PluginIcons, PluginMetadata


class CaptureConfigPostReq(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class CaptureConfigPutReq(BaseModel):
    name: str
    settings: dict[str, Any]


class CaptureConfigRes(BaseModel):
    id: str
    name: str
    plugin_id: str
    plugin_icon: Optional[str] | Optional[PluginIcons] = None
    plugin_is_loaded: bool = False
    settings: dict[str, Any]
    file_extension: Optional[str] = None


class CaptureConfigData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    plugin_id: str
    settings: dict[str, Any]
    file_extension: Optional[str] = None


class CaptureConfigLoaded(BaseModel):
    id: str
    name: str
    plugin_id: str
    plugin_metadata: PluginMetadata
    settings: dict[str, Any]
    file_extension: Optional[str] = None
