import json
from fastapi import status
from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.modules.organization.services.project_service import ProjectService
from api.modules.organization.services.protocol_service import ProtocolService
from httpx import ASGITransport, AsyncClient
import pytest
from api.main import app


@pytest.fixture
def temp_service(tmp_path):
    tmp_data_path = tmp_path / "data"
    file_management = FileManagement(
        rel_path="projects", base_path=tmp_data_path, make_dirs=True)
    projects_storage = JsonStorage(
        file_name="projects.json", rel_path="projects", base_path=tmp_data_path
    )
    project_service = ProjectService()
    project_service.file_management = file_management
    project_service.projects_storage = projects_storage
    project_service._data_path = tmp_data_path
    project_service._projects_dir_name = "projects"
    protocol_service = ProtocolService()
    protocol_service.file_management = file_management
    protocol_service.project_service = project_service
    protocol_service._data_path = tmp_data_path

    return protocol_service, project_service, tmp_data_path


@pytest.mark.asyncio
async def test_create_protocol(temp_service):
    protocol_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ProtocolService] = lambda: protocol_service
    project_name = "test_project"

    # Create a temporary file for activity path
    activity_path = tmp_data_path / "activity_file.txt"
    with open(activity_path, "w") as f:
        f.write("This is a test activity file.")

    protocol = {
        "name": "test_protocol",
        "activities": [
            {
                "name": "test_activity",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 60,
                "start_message": "Start",
                "end_message": "End",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_2",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post(
            f"/projects/",
            json={"name": project_name},
        )

        # Now create the protocol
        response = await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol,
        )

    assert response.status_code == status.HTTP_201_CREATED
    response_data = response.json()
    assert response_data["name"] == protocol["name"]
    assert len(response_data["activities"]) == len(protocol["activities"])
    assert response_data["activities"][0]["name"] == protocol["activities"][0]["name"]
    assert response_data["activities"][1]["name"] == protocol["activities"][1]["name"]

    # Check if the protocols data is saved in the file
    protocols_data = tmp_data_path / "projects" / project_name / "protocols.json"
    with open(protocols_data) as f:
        protocols = json.load(f)
        assert len(protocols) == 1
        assert protocols[0]["name"] == protocol["name"]
        assert len(protocols[0]["activities"]) == len(protocol["activities"])
        assert protocols[0]["activities"][0]["name"] == protocol["activities"][0]["name"]
        assert protocols[0]["activities"][1]["name"] == protocol["activities"][1]["name"]


@pytest.mark.asyncio
async def test_get_all_protocols(temp_service):
    protocol_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ProtocolService] = lambda: protocol_service
    project_name = "test_project"

    # Create a temporary file for activity path
    activity_path = tmp_data_path / "activity_file.txt"
    with open(activity_path, "w") as f:
        f.write("This is a test activity file.")

    protocol1 = {
        "name": "test_protocol",
        "activities": [
            {
                "name": "test_activity",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 60,
                "start_message": "Start",
                "end_message": "End",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_2",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    protocol2 = {
        "name": "test_protocol_2",
        "activities": [
            {
                "name": "test_activity_3",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 120,
                "start_message": "Start 2",
                "end_message": "End 2",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_4",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post(
            f"/projects/",
            json={"name": project_name},
        )

        # Now create the protocols
        await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol1,
        )

        await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol2,
        )

        # Now get all protocols
        response = await client.get(
            f"/projects/{project_name}/protocols/"
        )

    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert len(response_data) == 2
    assert response_data[0]["name"] == protocol1["name"]
    assert response_data[1]["name"] == protocol2["name"]
    assert len(response_data[0]["activities"]) == len(protocol1["activities"])
    assert len(response_data[1]["activities"]) == len(protocol2["activities"])


@pytest.mark.asyncio
async def test_get_protocol(temp_service):
    protocol_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ProtocolService] = lambda: protocol_service
    project_name = "test_project"

    # Create a temporary file for activity path
    activity_path = tmp_data_path / "activity_file.txt"
    with open(activity_path, "w") as f:
        f.write("This is a test activity file.")

    protocol = {
        "name": "test_protocol",
        "activities": [
            {
                "name": "test_activity",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 60,
                "start_message": "Start",
                "end_message": "End",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_2",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post(
            f"/projects/",
            json={"name": project_name},
        )

        # Now create the protocol
        await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol,
        )

        # Now get the protocol
        response = await client.get(
            f"/projects/{project_name}/protocols/{protocol['name']}"
        )

    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["name"] == protocol["name"]
    assert len(response_data["activities"]) == len(protocol["activities"])
    assert response_data["activities"][0]["name"] == protocol["activities"][0]["name"]
    assert response_data["activities"][1]["name"] == protocol["activities"][1]["name"]


@pytest.mark.asyncio
async def test_update_protocol(temp_service):
    protocol_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ProtocolService] = lambda: protocol_service
    project_name = "test_project"

    # Create a temporary file for activity path
    activity_path = tmp_data_path / "activity_file.txt"
    with open(activity_path, "w") as f:
        f.write("This is a test activity file.")

    protocol = {
        "name": "test_protocol",
        "activities": [
            {
                "name": "test_activity",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 60,
                "start_message": "Start",
                "end_message": "End",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_2",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post(
            f"/projects/",
            json={"name": project_name},
        )

        # Now create the protocol
        await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol,
        )

        # Now update the protocol
        updated_protocol = {
            "name": "updated_test_protocol",
            "activities": [
                {
                    "name": "updated_test_activity",
                    "path": str(activity_path),
                    "has_time_limit": True,
                    "time_limit": 120,
                    "start_message": "Updated Start",
                    "end_message": "Updated End",
                    "close_activity": False,
                    "process_name": "",
                    "show_timer": True,
                },
            ],
        }

        response = await client.put(
            f"/projects/{project_name}/protocols/{protocol['name']}",
            json=updated_protocol,
        )

    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["name"] == updated_protocol["name"]
    assert len(response_data["activities"]) == len(
        updated_protocol["activities"])
    assert response_data["activities"][0]["name"] == updated_protocol["activities"][0]["name"]

    # Check if the protocols data is updated in the file
    protocols_data = tmp_data_path / "projects" / project_name / "protocols.json"
    with open(protocols_data) as f:
        protocols = json.load(f)
        assert len(protocols) == 1
        assert protocols[0]["name"] == updated_protocol["name"]
        assert len(protocols[0]["activities"]) == len(
            updated_protocol["activities"])
        assert protocols[0]["activities"][0]["name"] == updated_protocol["activities"][0]["name"]


@pytest.mark.asyncio
async def test_delete_protocol(temp_service):
    protocol_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ProtocolService] = lambda: protocol_service
    project_name = "test_project"

    # Create a temporary file for activity path
    activity_path = tmp_data_path / "activity_file.txt"
    with open(activity_path, "w") as f:
        f.write("This is a test activity file.")

    protocol = {
        "name": "test_protocol",
        "activities": [
            {
                "name": "test_activity",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 60,
                "start_message": "Start",
                "end_message": "End",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_2",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post(
            f"/projects/",
            json={"name": project_name},
        )

        # Now create the protocol
        await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol,
        )

        # Now delete the protocol
        response = await client.delete(
            f"/projects/{project_name}/protocols/{protocol['name']}"
        )

    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Check if the protocols data is deleted from the file
    protocols_data = tmp_data_path / "projects" / project_name / "protocols.json"
    with open(protocols_data) as f:
        protocols = json.load(f)
        assert len(protocols) == 0


@pytest.mark.asyncio
async def test_lock_protocol(temp_service):
    protocol_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ProtocolService] = lambda: protocol_service
    project_name = "test_project"

    # Create a temporary file for activity path
    activity_path = tmp_data_path / "activity_file.txt"
    with open(activity_path, "w") as f:
        f.write("This is a test activity file.")

    protocol = {
        "name": "test_protocol",
        "activities": [
            {
                "name": "test_activity",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 60,
                "start_message": "Start",
                "end_message": "End",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_2",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post(
            f"/projects/",
            json={"name": project_name},
        )

        # Now create the protocol
        await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol,
        )

        # Now lock the protocol
        response = await client.post(
            f"/projects/{project_name}/protocols/{protocol['name']}/lock"
        )

    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["locked"] is True

    # Check if the protocols data is updated in the file
    protocols_data = tmp_data_path / "projects" / project_name / "protocols.json"
    with open(protocols_data) as f:
        protocols = json.load(f)
        assert len(protocols) == 1
        assert protocols[0]["locked"] is True


@pytest.mark.asyncio
async def test_unlock_protocol(temp_service):
    protocol_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ProtocolService] = lambda: protocol_service
    project_name = "test_project"

    # Create a temporary file for activity path
    activity_path = tmp_data_path / "activity_file.txt"
    with open(activity_path, "w") as f:
        f.write("This is a test activity file.")

    protocol = {
        "name": "test_protocol",
        "activities": [
            {
                "name": "test_activity",
                "path": str(activity_path),
                "has_time_limit": True,
                "time_limit": 60,
                "start_message": "Start",
                "end_message": "End",
                "close_activity": False,
                "process_name": "",
                "show_timer": True,
            },
            {
                "name": "test_activity_2",
                "path": "",
                "has_time_limit": False,
                "time_limit": 0,
                "start_message": "",
                "end_message": "",
                "close_activity": False,
                "process_name": "",
                "show_timer": False,
            }
        ],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post(
            f"/projects/",
            json={"name": project_name},
        )

        # Now create the protocol
        await client.post(
            f"/projects/{project_name}/protocols/",
            json=protocol,
        )

        # Now lock the protocol
        await client.post(
            f"/projects/{project_name}/protocols/{protocol['name']}/lock"
        )

        # Now unlock the protocol
        response = await client.post(
            f"/projects/{project_name}/protocols/{protocol['name']}/unlock"
        )

    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["locked"] is False

    # Check if the protocols data is updated in the file
    protocols_data = tmp_data_path / "projects" / project_name / "protocols.json"
    with open(protocols_data) as f:
        protocols = json.load(f)
        assert len(protocols) == 1
        assert protocols[0]["locked"] is False
