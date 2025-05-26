from pydantic import BaseModel

class CaptureStartRequest(BaseModel):
    project_name: str
    participant_code: str
