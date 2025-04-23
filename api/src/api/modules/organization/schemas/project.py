from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProjectRes(BaseModel):
    name: str
    description: str
    location: str
    locked: bool
    created_at: datetime
    updated_at: datetime


class ProjectPostReq(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectPutReq(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
