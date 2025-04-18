from fastapi import APIRouter, Depends

from api.modules.organization.schemas.project import ProjectPostReq, ProjectRes
from api.modules.organization.services.project_service import ProjectService

project_router = APIRouter(prefix="/projects", tags=["projects"])


@project_router.post("/", response_model=ProjectRes, description="Create a new project")
async def create_project(project: ProjectPostReq, service: ProjectService = Depends()):
    return service.create_project(project)
