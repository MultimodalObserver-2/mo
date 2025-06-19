from typing import Any

from pydantic import BaseModel

class PlaybackConfigPostReq(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class PlaybackConfigPutReq(BaseModel):
    name: str
    settings: dict[str, Any]


class PlaybackConfigRes(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]


class PlaybackConfigData(BaseModel):
    name: str
    plugin_id: str
    settings: dict[str, Any]
