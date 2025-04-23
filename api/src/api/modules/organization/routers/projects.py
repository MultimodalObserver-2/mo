from fastapi import APIRouter, Depends, status

from api.modules.organization.schemas.project import (ProjectPostReq,
                                                      ProjectPutReq,
                                                      ProjectRes)
from api.modules.organization.services.project_service import ProjectService

project_router = APIRouter(prefix="/projects", tags=["projects"])


@project_router.post("/", response_model=ProjectRes, description="Create a new project")
async def create_project(project: ProjectPostReq, service: ProjectService = Depends()):
    return service.create_project(project)


@project_router.get("/", response_model=list[ProjectRes], description="Get all projects")
async def get_all_projects(service: ProjectService = Depends()):
    return service.get_all_projects()


@project_router.put("/{project_name}", response_model=ProjectRes, description="Update a project")
async def update_project(
    project_name: str, project: ProjectPutReq, service: ProjectService = Depends()
):
    return service.update_project(project_name, project)


@project_router.get("/{project_name}", response_model=ProjectRes, description="Get a project")
async def get_project(project_name: str, service: ProjectService = Depends()):
    return service.get_project(project_name)


@project_router.delete(
    "/{project_name}", description="Delete a project", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_project(project_name: str, service: ProjectService = Depends()):
    return service.delete_project(project_name)


@project_router.post(
    "/{project_name}/lock", response_model=ProjectRes, description="Lock a project"
)
async def lock_project(project_name: str, service: ProjectService = Depends()):
    return service.lock_project(project_name)


@project_router.post(
    "/{project_name}/unlock", response_model=ProjectRes, description="Unlock a project"
)
async def unlock_project(project_name: str, service: ProjectService = Depends()):
    return service.unlock_project(project_name)
