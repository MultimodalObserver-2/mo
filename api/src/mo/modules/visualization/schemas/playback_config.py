from typing import Any
import uuid

from pydantic import BaseModel, Field

class PlaybackConfigPostReq(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class PlaybackConfigPutReq(BaseModel):
    name: str
    settings: dict[str, Any]


class PlaybackConfigRes(BaseModel):
    id: str
    name: str
    plugin_id: str
    settings: dict[str, Any]


class PlaybackConfigData(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    plugin_id: str
    settings: dict[str, Any]
