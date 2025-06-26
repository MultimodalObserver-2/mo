from typing import Any, Optional
import uuid

from pydantic import BaseModel, Field

class PlaybackConfigPostReq(BaseModel):
    name: str
    plugin_id: str
    capture_config_id: Optional[str] = None
    settings: dict[str, Any]


class PlaybackConfigPutReq(BaseModel):
    name: str
    capture_config_id: Optional[str] = None
    settings: dict[str, Any]


class PlaybackConfigRes(BaseModel):
    id: str
    name: str
    plugin_id: str
    capture_config_id: Optional[str] = None
    settings: dict[str, Any]


class PlaybackConfigData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    plugin_id: str
    capture_config_id: Optional[str] = None
    settings: dict[str, Any]
