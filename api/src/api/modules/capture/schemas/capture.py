from pydantic import BaseModel

class CaptureStartRequest(BaseModel):
    project_name: str
    participant_code: str

class CaptureStatusResponse(BaseModel):
    started: bool
    paused: bool
