import os
from datetime import datetime
from typing import Optional
import uuid

from pydantic import BaseModel, Field

from mo.modules.organization.services.paths import PROJECTS_PATH


class ProjectData(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    rel_location: str
    locked: bool = False
    created_at: datetime
    updated_at: datetime


class ProjectRes(BaseModel):
    uuid: str
    name: str
    description: str
    location: str
    locked: bool
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_data(data: ProjectData) -> "ProjectRes":
        return ProjectRes(
            uuid=data.uuid,
            name=data.name,
            description=data.description,
            location=os.path.join(PROJECTS_PATH, data.rel_location),
            locked=data.locked,
            created_at=data.created_at,
            updated_at=data.updated_at,
        )


class ProjectPostReq(BaseModel):
    name: str
    description: Optional[str] = ""


class ProjectPutReq(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
