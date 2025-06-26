import os
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel

from mo.modules.organization.services.paths import PROJECTS_PATH


# Stored schemas
class CaptureConfigDetails(BaseModel):
    config_id: str
    config_name: str
    plugin_id: str
    plugin_name: str
    plugin_version: str
    settings: dict[str, Any]
    start_timestamp: float | None = None
    file_extension: str
    rel_location: str


class SessionData(BaseModel):
    session_id: str
    rel_location: str
    start_timestamp: float
    end_timestamp: float | None = None
    paused_time: float | None = None
    started_at: datetime
    ended_at: datetime | None = None
    duration: float | None = None
    paused_intervals: list[tuple[float, float | None]] = []
    capture_sources: list[CaptureConfigDetails] = []


# Response schemas
class CaptureConfigDetailsRes(BaseModel):
    config_id: str
    config_name: str
    plugin_id: str
    plugin_name: str
    plugin_version: str
    settings: dict[str, Any]
    start_timestamp: float | None = None
    file_extension: str
    location: str

    @staticmethod
    def from_capture_source_setting(
        capture_source_setting: CaptureConfigDetails,
        project_rel_location: str,
        participant_rel_location: str,
    ):
        return CaptureConfigDetailsRes(
            config_id=capture_source_setting.config_id,
            config_name=capture_source_setting.config_name,
            plugin_id=capture_source_setting.plugin_id,
            plugin_name=capture_source_setting.plugin_name,
            plugin_version=capture_source_setting.plugin_version,
            settings=capture_source_setting.settings,
            start_timestamp=capture_source_setting.start_timestamp,
            file_extension=capture_source_setting.file_extension,
            location=os.path.join(
                PROJECTS_PATH,
                project_rel_location,
                participant_rel_location,
                capture_source_setting.rel_location,
            ),
        )


class SessionRes(BaseModel):
    session_id: str
    location: str
    start_timestamp: float
    end_timestamp: float | None = None
    paused_time: float | None = None
    duration: float | None = None
    started_at: datetime
    ended_at: datetime | None = None
    paused_intervals: list[tuple[float, float | None]] = []
    capture_sources: list[CaptureConfigDetailsRes] = []

    @staticmethod
    def from_session_data(
        session_data: SessionData, project_rel_location: str, participant_rel_location: str
    ) -> "SessionRes":
        return SessionRes(
            session_id=session_data.session_id,
            location=os.path.join(
                PROJECTS_PATH,
                project_rel_location,
                participant_rel_location,
                session_data.rel_location,
            ),
            start_timestamp=session_data.start_timestamp,
            end_timestamp=session_data.end_timestamp,
            paused_time=session_data.paused_time,
            duration=session_data.duration,
            started_at=session_data.started_at,
            ended_at=session_data.ended_at,
            paused_intervals=session_data.paused_intervals,
            capture_sources=[
                CaptureConfigDetailsRes.from_capture_source_setting(
                    source, project_rel_location, participant_rel_location
                )
                for source in session_data.capture_sources
            ],
        )


# Post schemas
class CaptureConfigDetailsPost(BaseModel):
    config_id: str
    config_name: str
    plugin_id: str
    plugin_name: str
    plugin_version: str
    settings: dict[str, Any]
    file_extension: str
    file_name: str


class SessionPost(BaseModel):
    start_timestamp: float
    started_at: datetime
    capture_sources: list[CaptureConfigDetailsPost] = []


# Put schemas
class CaptureConfigDetailsPut(BaseModel):
    config_id: str
    start_timestamp: Optional[float] = None


class SessionPut(BaseModel):
    start_timestamp: Optional[float] = None
    end_timestamp: Optional[float] = None
    paused_time: Optional[float] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration: Optional[float] = None
    paused_intervals: list[tuple[float, float | None]] = []
    capture_sources: list[CaptureConfigDetailsPut] = []

    @staticmethod
    def from_session_res(session_res: SessionRes):
        return SessionPut(
            start_timestamp=session_res.start_timestamp,
            end_timestamp=session_res.end_timestamp,
            paused_time=session_res.paused_time,
            started_at=session_res.started_at,
            ended_at=session_res.ended_at,
            duration=session_res.duration,
            paused_intervals=session_res.paused_intervals,
            capture_sources=[
                CaptureConfigDetailsPut(
                    config_id=source.config_id,
                    start_timestamp=source.start_timestamp
                )
                for source in session_res.capture_sources
            ],
        )
