from datetime import datetime
from email import message
from typing import Optional
import uuid

from pydantic import BaseModel, Field


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

    @staticmethod
    def from_activity_req(data: "ActivityPostReq | ActivityPutReq", order: int) -> "Activity":
        return Activity(
            order=order,  
            name=data.name,
            path=data.path or "",
            has_time_limit=data.has_time_limit,
            time_limit=data.time_limit if data.has_time_limit else 0,
            start_message=data.start_message or "",
            end_message=data.end_message or "",
            close_activity=data.close_activity,
            process_name=data.process_name or "",
            show_timer=data.show_timer,
        )

class ProtocolData(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    activities: list[Activity]
    locked: bool = False
    created_at: datetime
    updated_at: datetime


class ProtocolRes(BaseModel):
    uuid: str
    name: str
    activities: list[Activity]
    locked: bool
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_data(data: ProtocolData) -> "ProtocolRes":
        return ProtocolRes(
            uuid=data.uuid,
            name=data.name,
            activities=data.activities,
            locked=data.locked,
            created_at=data.created_at,
            updated_at=data.updated_at,
        )


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
