from datetime import datetime
import os
from typing import Optional

from api.modules.organization.services.paths import PROJECTS_PATH
from pydantic import BaseModel


class ProjectData(BaseModel):
    name: str
    description: str = ""
    rel_location: str
    locked: bool = False
    created_at: datetime
    updated_at: datetime


class ProjectRes(BaseModel):
    name: str
    description: str
    location: str
    locked: bool
    created_at: datetime
    updated_at: datetime

    @staticmethod
    def from_data(data: ProjectData) -> "ProjectRes":
        return ProjectRes(
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
