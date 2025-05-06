from datetime import datetime
from email import message
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
    process_name: str
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
    process_name: Optional[str] = ""
    show_timer: bool


class ProtocolPostReq(BaseModel):
    name: str
    activities: list[ActivityPostReq]


class ActivityPutReq(BaseModel):
    name: str
    path: Optional[str] = ""
    has_time_limit: bool
    time_limit: int = 0
    start_message: Optional[str] = ""
    end_message: Optional[str] = ""
    close_activity: bool
    process_name: Optional[str] = ""
    show_timer: bool


class ProtocolPutReq(BaseModel):
    name: Optional[str] = None
    activities: Optional[list[ActivityPutReq]] = None


class ProtocolExecMsg(BaseModel):
    activity_name: Optional[str] = None
    activity_num: Optional[int] = None
    message: str
    message_type: str
    total_activities: Optional[int] = None
    has_time_limit: Optional[bool] = None
    show_timer: Optional[bool] = None
