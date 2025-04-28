from unittest.mock import MagicMock, patch

import pytest

from api.core.file_management.json_storage import JsonStorage
from api.core.utils.http_exceptions import (AlreadyExistsException,
                                            BadRequestException,
                                            NotFoundException)
from api.modules.organization.schemas.project import (ProjectPostReq,
                                                      ProjectPutReq)
from api.modules.organization.services.project_service import ProjectService


@pytest.fixture
def project_service():
    service = ProjectService()

    service.file_management = MagicMock()
    service.projects_storage = MagicMock()
    return service


def test_create_project_success(project_service):
    project_data = {"name": "Test Project", "description": "A test project"}
    project_service.projects_storage.exists.return_value = False
    project_service.file_management.create_directory.return_value = "/path/to/Test Project"
    project_service.projects_storage.insert_one.return_value = None
    project_req = ProjectPostReq(**project_data)
    with patch(
        "api.core.file_management.json_storage.JsonStorage.create_storage"
    ) as mock_create_storage:
        mock_create_storage.return_value = None
        result = project_service.create_project(project_req)
        assert result.name == "Test Project"
        assert result.description == "A test project"
        assert result.location == "/path/to/Test Project"
        assert not result.locked
        project_service.file_management.create_directory.assert_called()
        project_service.projects_storage.insert_one.assert_called()


def test_create_project_already_exists(project_service):
    project_data = {"name": "Existing Project", "description": "A test project"}
    project_service.exists = MagicMock(return_value=True)

    project_req = ProjectPostReq(**project_data)
    with pytest.raises(AlreadyExistsException):
        project_service.create_project(project_req)


def test_create_project_invalid_name(project_service):
    project_data = {"name": "Invalid/Project", "description": "A test project"}
    project_service.exists = MagicMock(return_value=False)
    project_service.file_management.create_directory.return_value = "/path/to/project"

    project_req = ProjectPostReq(**project_data)
    with pytest.raises(BadRequestException):
        project_service.create_project(project_req)


def test_get_all_projects_success(project_service):
    project_service.projects_storage.find_all.return_value = [
        {
            "name": "Project 1",
            "description": "First project",
            "location": "/path/to/Project 1",
            "locked": False,
            "created_at": "2025-04-23 10:00:45.687379",
            "updated_at": "2025-04-23 10:00:45.687379",
        },
        {
            "name": "Project 2",
            "description": "Second project",
            "location": "/path/to/Project 2",
            "locked": False,
            "created_at": "2025-04-23 10:00:45.687379",
            "updated_at": "2025-04-23 10:00:45.687379",
        },
    ]

    result = project_service.get_all_projects()

    assert len(result) == 2
    assert result[0].name == "Project 1"
    assert result[1].name == "Project 2"
    project_service.projects_storage.find_all.assert_called()


def test_update_project_success(project_service):
    project_name = "Test Project"
    project_data = {"name": "Updated Project", "description": "Updated description"}
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/project",
        "locked": False,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }

    project_service.projects_storage.find_one.return_value = existing_project
    project_service.projects_storage.exists.return_value = False
    project_service.file_management.rename_directory.return_value = "/path/to/Updated Project"
    project_service.projects_storage.update.return_value = None

    project_req = ProjectPutReq(**project_data)
    result = project_service.update_project(project_name, project_req)

    assert result.name == "Updated Project"
    assert result.description == "Updated description"
    assert result.location == "/path/to/Updated Project"
    assert result.locked == False
    project_service.projects_storage.update.assert_called()


def test_update_project_not_found(project_service):
    project_name = "Nonexistent Project"
    project_data = {"name": "Updated Project", "description": "Updated description"}
    project_service.projects_storage.find_one.return_value = None

    project_req = ProjectPutReq(**project_data)
    with pytest.raises(NotFoundException):
        project_service.update_project(project_name, project_req)


def test_update_project_locked(project_service):
    project_name = "Locked Project"
    project_data = {"name": "Updated Project", "description": "Updated description"}
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Updated Project",
        "locked": True,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project

    project_req = ProjectPutReq(**project_data)
    with pytest.raises(BadRequestException):
        project_service.update_project(project_name, project_req)


def test_update_project_invalid_name(project_service):
    project_name = "Updated Project"
    project_data = {"name": "Invalid/Project*", "description": "Updated description"}
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Updated Project",
        "locked": False,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project

    project_req = ProjectPutReq(**project_data)
    with pytest.raises(BadRequestException):
        project_service.update_project(project_name, project_req)


def test_update_project_already_exists(project_service):
    project_name = "Existing Project"
    project_data = {"name": "Updated Project", "description": "Updated description"}
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Updated Project",
        "locked": False,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project
    project_service.projects_storage.exists.return_value = True

    project_req = ProjectPutReq(**project_data)
    with pytest.raises(AlreadyExistsException):
        project_service.update_project(project_name, project_req)


def test_get_project_success(project_service):
    project_name = "Test Project"
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Test Project",
        "locked": False,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project

    result = project_service.get_project(project_name)

    assert result.name == project_name
    assert result.description == "A test project"
    assert result.location == "/path/to/Test Project"
    assert result.locked == False
    project_service.projects_storage.find_one.assert_called()


def test_get_project_not_found(project_service):
    project_name = "Nonexistent Project"
    project_service.projects_storage.find_one.return_value = None

    with pytest.raises(NotFoundException):
        project_service.get_project(project_name)


def test_delete_project_success(project_service):
    project_name = "Test Project"
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Test Project",
        "locked": False,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project
    project_service.file_management.delete_directory.return_value = None
    project_service.projects_storage.delete_one.return_value = None

    result = project_service.delete_project(project_name)

    assert result is None
    project_service.file_management.delete_directory.assert_called()
    project_service.projects_storage.delete_one.assert_called()


def test_delete_project_not_found(project_service):
    project_name = "Nonexistent Project"
    project_service.projects_storage.exists.return_value = False

    with pytest.raises(NotFoundException):
        project_service.delete_project(project_name)


def test_delete_project_locked(project_service):
    project_name = "Locked Project"
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Locked Project",
        "locked": True,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project

    with pytest.raises(BadRequestException):
        project_service.delete_project(project_name)


def test_lock_project_success(project_service):
    project_name = "Test Project"
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Test Project",
        "locked": False,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project

    result = project_service.lock_project(project_name)

    assert result.locked == True
    project_service.projects_storage.update.assert_called()


def test_lock_project_not_found(project_service):
    project_name = "Nonexistent Project"
    project_service.projects_storage.find_one.return_value = None

    with pytest.raises(NotFoundException):
        project_service.lock_project(project_name)


def test_unlock_project_success(project_service):
    project_name = "Test Project"
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Test Project",
        "locked": True,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project

    result = project_service.unlock_project(project_name)

    assert result.locked == False
    project_service.projects_storage.update.assert_called()


def test_unlock_project_not_found(project_service):
    project_name = "Nonexistent Project"
    project_service.projects_storage.find_one.return_value = None

    with pytest.raises(NotFoundException):
        project_service.unlock_project(project_name)


def test_is_project_locked_success(project_service):
    project_name = "Test Project"
    existing_project = {
        "name": project_name,
        "description": "A test project",
        "location": "/path/to/Test Project",
        "locked": True,
        "created_at": "2025-04-23 10:00:45.687379",
        "updated_at": "2025-04-23 10:00:45.687379",
    }
    project_service.projects_storage.find_one.return_value = existing_project

    result = project_service.is_project_locked(project_name)

    assert result == True
    project_service.projects_storage.find_one.assert_called()


def test_is_project_locked_not_found(project_service):
    project_name = "Nonexistent Project"
    project_service.projects_storage.find_one.return_value = None

    with pytest.raises(NotFoundException):
        project_service.is_project_locked(project_name)


def test_exists_success(project_service):
    project_name = "Test Project"
    project_service.projects_storage.exists.return_value = True

    result = project_service.exists(project_name)

    assert result == True
