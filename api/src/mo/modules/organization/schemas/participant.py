import os
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field

from mo.modules.organization.services.paths import PROJECTS_PATH


class ParticipantData(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    name: str
    notes: list[str] = []
    rel_location: str
    locked: bool = False
    created_at: datetime
    updated_at: datetime


class ParticipantRes(BaseModel):
    uuid: str
    code: str
    name: str
    notes: list[str]
    location: str
    locked: bool
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_data(data: ParticipantData, project_rel_location: str) -> "ParticipantRes":
        return ParticipantRes(
            uuid=data.uuid,
            code=data.code,
            name=data.name,
            notes=data.notes,
            location=os.path.join(PROJECTS_PATH, project_rel_location, data.rel_location),
            locked=data.locked,
            created_at=data.created_at,
            updated_at=data.updated_at,
        )


class ParticipantPostReq(BaseModel):
    code: str
    name: str
    notes: Optional[list[str]] = []


class ParticipantPutReq(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    notes: Optional[list[str]] = None
