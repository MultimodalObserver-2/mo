from dataclasses import dataclass

from pydantic import BaseModel

from mo.modules.capture.plugins.capture_plugin import PicklableType


class CaptureStartRequest(BaseModel):
    project_name: str
    participant_code: str


class CaptureStatusResponse(BaseModel):
    started: bool
    paused: bool
    project_name: str | None = None
    participant_code: str | None = None


# Internal Data Models
@dataclass
class PluginData:
    plugin_id: str
    config_id: str
    timestamp: float
    data: PicklableType
