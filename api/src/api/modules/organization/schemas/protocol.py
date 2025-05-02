from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class Activity(BaseModel):
    order: int
    name: str
    path: str
    has_time_limit: bool
    time_limit: int
    start_message: str
    end_message: str
    close_activity: bool
    show_timer: bool


class ProtocolRes(BaseModel):
    name: str
    activities: list[Activity]
    locked: bool
    created_at: datetime
    updated_at: datetime


class ActivityPostReq(BaseModel):
    name: str
    path: Optional[str] = ""
    has_time_limit: bool
    time_limit: int = 0
    start_message: Optional[str] = ""
    end_message: Optional[str] = ""
    close_activity: bool
    show_timer: bool


class ProtocolPostReq(BaseModel):
    name: str
    activities: list[ActivityPostReq]
