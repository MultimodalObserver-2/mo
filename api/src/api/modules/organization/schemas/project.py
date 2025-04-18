from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProjectPostReq(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectRes(BaseModel):
    name: str
    description: str
    location: str
    created_at: datetime
    updated_at: datetime
