from fastapi import APIRouter, Depends, Path, status

from mo.modules.organization.schemas.project import (ProjectPostReq,
                                                      ProjectPutReq,
                                                      ProjectRes)
from mo.modules.organization.services.project_service import ProjectService

project_router = APIRouter(
    prefix="/projects",
    tags=["projects"],
)


@project_router.post(
    "/",
    response_model=ProjectRes,
    summary="Create a new project",
    description="Create a new project by specifying its name and description.",
    status_code=status.HTTP_201_CREATED,
    responses={
        409: {"description": "Project already exists"},
        400: {"description": "Invalid project name"},
    },
)
async def create_project(project: ProjectPostReq, service: ProjectService = Depends()):
    return service.create_project(project)


@project_router.get(
    "/",
    response_model=list[ProjectRes],
    summary="Get all projects",
    description="Retrieve a list of all existing projects.",
)
async def get_all_projects(service: ProjectService = Depends()):
    return service.get_all_projects()


@project_router.put(
    "/{project_name}",
    response_model=ProjectRes,
    summary="Update a project",
    description="Update the information of an existing project.",
    responses={
        404: {"description": "Project not found"},
        400: {"description": "Project is locked or invalid new name"},
        409: {"description": "New project name already exists"},
    },
)
async def update_project(
    project: ProjectPutReq,
    project_name: str = Path(..., description="Name of the project to update"),
    service: ProjectService = Depends(),
):
    return service.update_project(project_name, project)


@project_router.get(
    "/{project_name}",
    response_model=ProjectRes,
    summary="Get a project",
    description="Retrieve details of a specific project by name.",
    responses={404: {"description": "Project not found"}},
)
async def get_project(
    project_name: str = Path(..., description="Name of the project to retrieve"),
    service: ProjectService = Depends(),
):
    return service.get_project(project_name)


@project_router.delete(
    "/{project_name}",
    summary="Delete a project",
    description="Delete a project by name.",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        404: {"description": "Project not found"},
        400: {"description": "Project is locked"},
    },
)
async def delete_project(
    project_name: str = Path(..., description="Name of the project to delete"),
    service: ProjectService = Depends(),
):
    return service.delete_project(project_name)


@project_router.post(
    "/{project_name}/lock",
    response_model=ProjectRes,
    summary="Lock a project",
    description="Lock a project to prevent modifications.",
    responses={404: {"description": "Project not found"}},
)
async def lock_project(
    project_name: str = Path(..., description="Name of the project to lock"),
    service: ProjectService = Depends(),
):
    return service.lock_project(project_name)


@project_router.post(
    "/{project_name}/unlock",
    response_model=ProjectRes,
    summary="Unlock a project",
    description="Unlock a project to allow modifications.",
    responses={404: {"description": "Project not found"}},
)
async def unlock_project(
    project_name: str = Path(..., description="Name of the project to unlock"),
    service: ProjectService = Depends(),
):
    return service.unlock_project(project_name)
