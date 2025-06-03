from pydantic import BaseModel

class CaptureStartRequest(BaseModel):
    project_name: str
    participant_code: str

class CaptureStatusResponse(BaseModel):
    started: bool
    paused: bool
    project_name: str | None = None
    participant_code: str | None = None
