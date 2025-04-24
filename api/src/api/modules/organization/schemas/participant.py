from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ParticipantRes(BaseModel):
    code: str
    name: str
    notes: list[str]
    location: str
    locked: bool
    created_at: datetime
    updated_at: datetime


class ParticipantPostReq(BaseModel):
    code: str
    name: str
    notes: Optional[list[str]] = []


class ParticipantPutReq(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    notes: Optional[list[str]] = None
