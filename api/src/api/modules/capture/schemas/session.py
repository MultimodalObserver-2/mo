from datetime import datetime
from typing import Any
from pydantic import BaseModel


# Stored schemas
class CaptureSettingDetails(BaseModel):
    setting_name: str
    plugin_id: str
    plugin_name: str
    plugin_version: str
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
    capture_sources: list[CaptureSettingDetails] = []

# Post schemas
class CaptureSettingDetailsPost(BaseModel):
    setting_name: str
    plugin_id: str
    plugin_name: str
    plugin_version: str
    settings: dict[str, Any]
    file_extension: str
    file_name: str

class SessionPost(BaseModel):
    start_timestamp: float
    started_at: datetime
    capture_sources: list[CaptureSettingDetailsPost] = []

# Response schemas
class CaptureSettingDetailsRes(BaseModel):
    setting_name: str
    plugin_id: str
    plugin_name: str
    plugin_version: str
    settings: dict[str, Any]
    start_timestamp: float | None = None
    file_extension: str
    location: str

    @staticmethod
    def from_capture_source_setting(
        capture_source_setting: CaptureSettingDetails
    ):
        return CaptureSettingDetailsRes(
            setting_name=capture_source_setting.setting_name,
            plugin_id=capture_source_setting.plugin_id,
            plugin_name=capture_source_setting.plugin_name,
            plugin_version=capture_source_setting.plugin_version,
            settings=capture_source_setting.settings,
            start_timestamp=capture_source_setting.start_timestamp,
            file_extension=capture_source_setting.file_extension,
            location=capture_source_setting.location
        )

class SessionRes(BaseModel):
    session_id: str
    location: str
    start_timestamp: float
    end_timestamp: float | None = None
    started_at: datetime
    capture_sources: list[CaptureSettingDetailsRes] = []
