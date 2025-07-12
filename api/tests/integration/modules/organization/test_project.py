import json

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

from mo.core.file_management.file_management import FileManagement
from mo.core.file_management.json_storage import JsonStorage
from mo.main import app
from mo.modules.organization.errors.project import (
    PROJECT_ALREADY_EXISTS,
    PROJECT_DOES_NOT_EXIST,
    PROJECT_IS_LOCKED,
    PROJECT_NAME_NOT_ALLOWED,
)
from mo.modules.organization.services.project_service import ProjectService


@pytest.fixture
def temp_service(tmp_path):
    tmp_data_path = tmp_path / "data"
    file_management = FileManagement(rel_path="projects", base_path=tmp_data_path, make_dirs=True)
    json_storage = JsonStorage(
        file_name="projects.json", rel_path="projects", base_path=tmp_data_path
    )

    project_service = ProjectService()
    project_service.file_management = file_management
    project_service.projects_storage = json_storage

    return project_service, tmp_data_path


@pytest.mark.asyncio
async def test_create_project_api(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.post("/projects/", json=data)

    # Check api response
    assert response.status_code == status.HTTP_201_CREATED
    response_data = response.json()
    assert response_data["name"] == data["name"]
    assert response_data["description"] == data["description"]

    # Check if the project is saved in the file
    project_path = tmp_data_path / "projects" / data["name"]
    assert project_path.exists() and project_path.is_dir()

    # Check if the project is saved in the JSON storage
    projects_file = tmp_data_path / "projects" / "projects.json"
    assert projects_file.exists()
    with open(projects_file, "r") as f:
        projects_data = json.load(f)
        assert any(
            project["name"] == data["name"] and project["description"] == data["description"]
            for project in projects_data
        )


@pytest.mark.asyncio
async def test_create_project_already_exists(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Try to create the same project again
        response = await client.post(
            "/projects/",
            json=data,
        )

    # Check api response
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == PROJECT_ALREADY_EXISTS(name=data["name"])


@pytest.mark.asyncio
async def test_create_project_invalid_data(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "/*Invalid Name*/", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        response = await client.post(
            "/projects/",
            json=data,
        )

    # Check api response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PROJECT_NAME_NOT_ALLOWED(name=data["name"])


@pytest.mark.asyncio
async def test_get_project_api(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Get the project
        response = await client.get(
            f"/projects/{data['name']}",
        )

    # Check api response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["name"] == data["name"]
    assert response_data["description"] == data["description"]


@pytest.mark.asyncio
async def test_get_project_not_found(temp_service):
    project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    project_name = "NonExistingProject"
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to get a non-existing project
        response = await client.get(
            f"/projects/{project_name}",
        )

    # Check api response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST(name=project_name)


@pytest.mark.asyncio
async def test_get_all_projects_api(temp_service):
    project_service, tmp_data_path = temp_service
    data1 = {"name": "Test Project 1", "description": "This is a test project 1."}
    data2 = {"name": "Test Project 2", "description": "This is a test project 2."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the projects first
        await client.post(
            "/projects/",
            json=data1,
        )
        await client.post(
            "/projects/",
            json=data2,
        )

        # Get all projects
        response = await client.get(
            "/projects/",
        )

    # Check api response
    assert response.status_code == 200
    response_data = response.json()
    assert len(response_data) == 2
    assert any(project["name"] == data1["name"] for project in response_data)
    assert any(project["name"] == data2["name"] for project in response_data)


@pytest.mark.asyncio
async def test_update_project_api(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Update the project
        update_data = {
            "name": "Test Project Updated",
            "description": "Updated description.",
        }
        response = await client.put(
            f"/projects/{data['name']}",
            json=update_data,
        )

    # Check api response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["name"] == update_data["name"]
    assert response_data["description"] == update_data["description"]

    # Check if the project is updated in the JSON storage
    projects_file = tmp_data_path / "projects" / "projects.json"
    assert projects_file.exists()
    with open(projects_file, "r") as f:
        projects_data = json.load(f)
        assert any(
            project["name"] == update_data["name"]
            and project["description"] == update_data["description"]
            for project in projects_data
        )

    # Check if the project directory name is updated
    project_path = tmp_data_path / "projects" / update_data["name"]
    assert project_path.exists() and project_path.is_dir()

    # Check if the old project directory is removed
    old_project_path = tmp_data_path / "projects" / data["name"]
    assert not old_project_path.exists()


@pytest.mark.asyncio
async def test_update_project_not_found(temp_service):
    project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    project_name = "NonExistingProject"
    update_data = {"description": "Updated description."}
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to update a non-existing project
        response = await client.put(
            f"/projects/{project_name}",
            json=update_data,
        )

    # Check api response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST(name=project_name)


@pytest.mark.asyncio
async def test_update_project_invalid_data(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Try to update the project with invalid data
        update_data = {
            "name": "/*Invalid Name*/",
            "description": "Updated description.",
        }
        response = await client.put(
            f"/projects/{data['name']}",
            json=update_data,
        )

    # Check api response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PROJECT_NAME_NOT_ALLOWED(name=update_data["name"])


@pytest.mark.asyncio
async def test_update_project_already_exists(temp_service):
    project_service, tmp_data_path = temp_service
    data1 = {"name": "Test Project 1", "description": "This is a test project 1."}
    data2 = {"name": "Test Project 2", "description": "This is a test project 2."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the projects first
        await client.post(
            "/projects/",
            json=data1,
        )
        await client.post(
            "/projects/",
            json=data2,
        )

        # Try to update the first project to have the same name as the second
        update_data = {
            "name": data2["name"],
            "description": "Updated description.",
        }
        response = await client.put(
            f"/projects/{data1['name']}",
            json=update_data,
        )

    # Check api response
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == PROJECT_ALREADY_EXISTS(name=update_data["name"])


@pytest.mark.asyncio
async def test_update_project_locked(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Lock the project first
        await client.post(
            f"/projects/{data['name']}/lock",
        )

        # Try to update the locked project
        update_data = {
            "description": "Updated description.",
        }
        response = await client.put(
            f"/projects/{data['name']}",
            json=update_data,
        )

    # Check api response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PROJECT_IS_LOCKED(name=data["name"])


@pytest.mark.asyncio
async def test_delete_project_api(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Delete the project
        response = await client.delete(
            f"/projects/{data['name']}",
        )

    # Check api response
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Check if the project is deleted from the JSON storage
    projects_file = tmp_data_path / "projects" / "projects.json"
    assert projects_file.exists()
    with open(projects_file, "r") as f:
        projects_data = json.load(f)
        assert not any(project["name"] == data["name"] for project in projects_data)

    # Check if the project directory is deleted
    project_path = tmp_data_path / "projects" / data["name"]
    assert not project_path.exists()


@pytest.mark.asyncio
async def test_delete_project_not_found(temp_service):
    project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    project_name = "NonExistingProject"
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to delete a non-existing project
        response = await client.delete(
            f"/projects/{project_name}",
        )

    # Check api response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST(name=project_name)


@pytest.mark.asyncio
async def test_delete_project_locked(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Lock the project first
        await client.post(
            f"/projects/{data['name']}/lock",
        )

        # Try to delete the locked project
        response = await client.delete(
            f"/projects/{data['name']}",
        )

    # Check api response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PROJECT_IS_LOCKED(name=data["name"])


@pytest.mark.asyncio
async def test_lock_project_api(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Lock the project
        response = await client.post(
            f"/projects/{data['name']}/lock",
        )

    # Check api response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["name"] == data["name"]
    assert response_data["description"] == data["description"]
    assert response_data["locked"] is True

    # Check if the project is locked in the JSON storage
    projects_file = tmp_data_path / "projects" / "projects.json"
    assert projects_file.exists()
    with open(projects_file, "r") as f:
        projects_data = json.load(f)
        assert any(
            project["name"] == data["name"] and project["locked"] is True
            for project in projects_data
        )


@pytest.mark.asyncio
async def test_lock_project_not_found(temp_service):
    project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    project_name = "NonExistingProject"
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to lock a non-existing project
        response = await client.post(
            f"/projects/{project_name}/lock",
        )

    # Check api response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST(name=project_name)


@pytest.mark.asyncio
async def test_unlock_project_api(temp_service):
    project_service, tmp_data_path = temp_service
    data = {"name": "Test Project", "description": "This is a test project."}
    app.dependency_overrides[ProjectService] = lambda: project_service

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create the project first
        await client.post(
            "/projects/",
            json=data,
        )

        # Lock the project first
        await client.post(
            f"/projects/{data['name']}/lock",
        )

        # Unlock the project
        response = await client.post(
            f"/projects/{data['name']}/unlock",
        )

    # Check api response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["name"] == data["name"]
    assert response_data["description"] == data["description"]
    assert response_data["locked"] is False

    # Check if the project is unlocked in the JSON storage
    projects_file = tmp_data_path / "projects" / "projects.json"
    assert projects_file.exists()
    with open(projects_file, "r") as f:
        projects_data = json.load(f)
        assert any(
            project["name"] == data["name"] and project["locked"] is False
            for project in projects_data
        )


@pytest.mark.asyncio
async def test_unlock_project_not_found(temp_service):
    project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    project_name = "NonExistingProject"
    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to unlock a non-existing project
        response = await client.post(
            f"/projects/{project_name}/unlock",
        )

    # Check api response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST(name=project_name)
