from datetime import datetime
from typing import Any
from api.core.api.schemas.plugin import PluginRes
from pydantic import BaseModel

class CaptureSourceSetting(BaseModel):
    setting_name: str
    plugin_id: str
    settings: dict[str, Any]
    start_timestamp: float | None = None
    file_extension: str
    location: str

class SessionData(BaseModel):
    session_id: str
    location: str
    start_timestamp: float
    end_timestamp: float | None = None
    started_at: datetime
    capture_sources: list[CaptureSourceSetting] = []

class CaptureSourceSettingPost(BaseModel):
    setting_name: str
    plugin_id: str
    settings: dict[str, Any]
    file_extension: str
    file_name: str

class SessionPost(BaseModel):
    start_timestamp: float
    started_at: datetime
    capture_sources: list[CaptureSourceSettingPost] = []

class CaptureSourceSettingRes(BaseModel):
    setting_name: str
    plugin: PluginRes
    settings: dict[str, Any]
    start_timestamp: float | None = None
    file_extension: str
    location: str

class SessionRes(BaseModel):
    session_id: str
    location: str
    start_timestamp: float
    end_timestamp: float | None = None
    started_at: datetime
    capture_sources: list[CaptureSourceSettingRes] = []
