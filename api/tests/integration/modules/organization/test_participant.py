import json

import pytest
from fastapi import status
from httpx import ASGITransport, AsyncClient

from mo.core.file_management.file_management import FileManagement
from mo.core.file_management.json_storage import JsonStorage
from mo.main import app
from mo.modules.organization.errors.participant import (
    PARTICIPANT_ALREADY_EXISTS, PARTICIPANT_CODE_NOT_ALLOWED,
    PARTICIPANT_DOES_NOT_EXIST, PARTICIPANT_IS_LOCKED)
from mo.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from mo.modules.organization.services.participant_service import \
    ParticipantService
from mo.modules.organization.services.project_service import ProjectService


@pytest.fixture
def temp_service(tmp_path):
    tmp_data_path = tmp_path / "data"
    file_management = FileManagement(rel_path="projects", base_path=tmp_data_path, make_dirs=True)
    projects_storage = JsonStorage(
        file_name="projects.json", rel_path="projects", base_path=tmp_data_path
    )
    project_service = ProjectService()
    project_service.file_management = file_management
    project_service.projects_storage = projects_storage
    project_service._data_path = tmp_data_path
    project_service._projects_dir_name = "projects"
    participant_service = ParticipantService()
    participant_service.file_management = file_management
    participant_service.project_service = project_service
    participant_service._data_path = tmp_data_path

    return participant_service, project_service, tmp_data_path


@pytest.mark.asyncio
async def test_create_participant(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        response = await client.post(f"/projects/{project_name}/participants/", json=participant)

    # Check the response
    assert response.status_code == status.HTTP_201_CREATED
    response_data = response.json()
    assert response_data["code"] == participant["code"]
    assert response_data["name"] == participant["name"]
    assert response_data["notes"] == participant["notes"]

    # Check if the participant directory was created
    participant_dir = (
        tmp_data_path / "projects" / project_name / f"participant[{participant['code']}]"
    )
    assert participant_dir.exists() and participant_dir.is_dir()

    # Check if the participant data file exists
    participants_data = tmp_data_path / "projects" / project_name / "participants.json"

    # Check if the participant data is correct
    with open(participants_data, "r") as f:
        participants_data = json.load(f)
        assert any(p["code"] == participant["code"] for p in participants_data)


@pytest.mark.asyncio
async def test_create_participant_already_exists(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Try to create the same participant again
        response = await client.post(f"/projects/{project_name}/participants/", json=participant)

    # Check the response
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == PARTICIPANT_ALREADY_EXISTS.format(
        code=participant["code"], project_name=project_name
    )


@pytest.mark.asyncio
async def test_create_participant_invalid_code(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    invalid_participant = {
        "code": "invalid/participant/*",
        "name": "Invalid Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now try to create a participant with an invalid code
        response = await client.post(
            f"/projects/{project_name}/participants/", json=invalid_participant
        )

    # Check the response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PARTICIPANT_CODE_NOT_ALLOWED.format(
        code=invalid_participant["code"]
    )


@pytest.mark.asyncio
async def test_get_all_participants(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant1 = {
        "code": "test_participant_1",
        "name": "Test Participant 1",
        "notes": ["Note 1", "Note 2"],
    }
    participant2 = {
        "code": "test_participant_2",
        "name": "Test Participant 2",
        "notes": ["Note 3", "Note 4"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create participants
        await client.post(f"/projects/{project_name}/participants/", json=participant1)
        await client.post(f"/projects/{project_name}/participants/", json=participant2)

        # Get all participants
        response = await client.get(f"/projects/{project_name}/participants/")

    # Check the response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert len(response_data) == 2
    assert any(p["code"] == participant1["code"] for p in response_data)
    assert any(p["code"] == participant2["code"] for p in response_data)


@pytest.mark.asyncio
async def test_get_all_participants_project_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    invalid_project_name = "invalid_project"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to get all participants from a non-existing project
        response = await client.get(f"/projects/{invalid_project_name}/participants/")

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST.format(name=invalid_project_name)


@pytest.mark.asyncio
async def test_get_participant(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Get the participant
        response = await client.get(f"/projects/{project_name}/participants/{participant['code']}")

    # Check the response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["code"] == participant["code"]
    assert response_data["name"] == participant["name"]
    assert response_data["notes"] == participant["notes"]


@pytest.mark.asyncio
async def test_get_participant_project_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    invalid_project_name = "invalid_project"
    participant_code = "test_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to get a participant from a non-existing project
        response = await client.get(
            f"/projects/{invalid_project_name}/participants/{participant_code}"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST.format(name=invalid_project_name)


@pytest.mark.asyncio
async def test_get_participant_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    invalid_participant_code = "invalid_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Try to get a non-existing participant
        response = await client.get(
            f"/projects/{project_name}/participants/{invalid_participant_code}"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PARTICIPANT_DOES_NOT_EXIST.format(
        code=invalid_participant_code, project_name=project_name
    )


@pytest.mark.asyncio
async def test_update_participant(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }
    updated_participant = {
        "code": "test_participant_updated",
        "name": "Updated Participant",
        "notes": ["Updated Note 1", "Updated Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Update the participant
        response = await client.put(
            f"/projects/{project_name}/participants/{participant['code']}", json=updated_participant
        )

    # Check the response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["code"] == updated_participant["code"]
    assert response_data["name"] == updated_participant["name"]
    assert response_data["notes"] == updated_participant["notes"]

    # Check if the participant data was updated in the storage
    participants_data = tmp_data_path / "projects" / project_name / "participants.json"
    with open(participants_data, "r") as f:
        participants_data = json.load(f)
        assert any(p["code"] == updated_participant["code"] for p in participants_data)
        assert not any(p["code"] == participant["code"] for p in participants_data)

    # Check if the participant directory was updated
    participant_dir = (
        tmp_data_path / "projects" / project_name / f"participant[{updated_participant['code']}]"
    )
    assert participant_dir.exists() and participant_dir.is_dir()


@pytest.mark.asyncio
async def test_update_participant_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    invalid_participant_code = "invalid_participant"
    updated_participant = {
        "code": "test_participant_updated",
        "name": "Updated Participant",
        "notes": ["Updated Note 1", "Updated Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Try to update a non-existing participant
        response = await client.put(
            f"/projects/{project_name}/participants/{invalid_participant_code}",
            json=updated_participant,
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PARTICIPANT_DOES_NOT_EXIST.format(
        code=invalid_participant_code, project_name=project_name
    )


@pytest.mark.asyncio
async def test_update_participant_invalid_code(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }
    invalid_updated_participant = {
        "code": "invalid/participant/*",
        "name": "Invalid Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Try to update the participant with an invalid code
        response = await client.put(
            f"/projects/{project_name}/participants/{participant['code']}",
            json=invalid_updated_participant,
        )

    # Check the response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PARTICIPANT_CODE_NOT_ALLOWED.format(
        code=invalid_updated_participant["code"]
    )


@pytest.mark.asyncio
async def test_update_participant_already_exists(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant1 = {
        "code": "test_participant_1",
        "name": "Test Participant 1",
        "notes": ["Note 1", "Note 2"],
    }
    participant2 = {
        "code": "test_participant_2",
        "name": "Test Participant 2",
        "notes": ["Note 3", "Note 4"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create participants
        await client.post(f"/projects/{project_name}/participants/", json=participant1)
        await client.post(f"/projects/{project_name}/participants/", json=participant2)

        # Try to update the first participant to have the same code as the second one
        response = await client.put(
            f"/projects/{project_name}/participants/{participant1['code']}",
            json={
                "code": participant2["code"],
                "name": participant1["name"],
                "notes": participant1["notes"],
            },
        )

    # Check the response
    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.json()["detail"] == PARTICIPANT_ALREADY_EXISTS.format(
        code=participant2["code"], project_name=project_name
    )


@pytest.mark.asyncio
async def test_update_participant_is_locked(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Lock the participant
        await client.post(f"/projects/{project_name}/participants/{participant['code']}/lock")

        # Try to update the locked participant
        response = await client.put(
            f"/projects/{project_name}/participants/{participant['code']}",
            json={"name": "Updated Participant", "notes": ["Updated Note 1"]},
        )

    # Check the response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PARTICIPANT_IS_LOCKED.format(
        code=participant["code"], project_name=project_name
    )


@pytest.mark.asyncio
async def test_delete_participant(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Delete the participant
        response = await client.delete(
            f"/projects/{project_name}/participants/{participant['code']}"
        )

    # Check the response
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Check if the participant data was removed from the storage
    participants_data = tmp_data_path / "projects" / project_name / "participants.json"
    with open(participants_data, "r") as f:
        participants_data = json.load(f)
        assert not any(p["code"] == participant["code"] for p in participants_data)

    # Check if the participant directory was removed
    participant_dir = (
        tmp_data_path / "projects" / project_name / f"participant[{participant['code']}]"
    )
    assert not participant_dir.exists() and not participant_dir.is_dir()


@pytest.mark.asyncio
async def test_delete_participant_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    invalid_participant_code = "invalid_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Try to delete a non-existing participant
        response = await client.delete(
            f"/projects/{project_name}/participants/{invalid_participant_code}"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PARTICIPANT_DOES_NOT_EXIST.format(
        code=invalid_participant_code, project_name=project_name
    )


@pytest.mark.asyncio
async def test_delete_participant_project_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    invalid_project_name = "invalid_project"
    participant_code = "test_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to delete a participant from a non-existing project
        response = await client.delete(
            f"/projects/{invalid_project_name}/participants/{participant_code}"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST.format(name=invalid_project_name)


@pytest.mark.asyncio
async def test_delete_participant_is_locked(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Lock the participant
        await client.post(f"/projects/{project_name}/participants/{participant['code']}/lock")

        # Try to delete the locked participant
        response = await client.delete(
            f"/projects/{project_name}/participants/{participant['code']}"
        )

    # Check the response
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.json()["detail"] == PARTICIPANT_IS_LOCKED.format(
        code=participant["code"], project_name=project_name
    )


@pytest.mark.asyncio
async def test_lock_participant(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Lock the participant
        response = await client.post(
            f"/projects/{project_name}/participants/{participant['code']}/lock"
        )

    # Check the response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["code"] == participant["code"]
    assert response_data["name"] == participant["name"]
    assert response_data["notes"] == participant["notes"]
    assert response_data["locked"] is True

    # Check if the participant data was updated in the storage
    participants_data = tmp_data_path / "projects" / project_name / "participants.json"
    with open(participants_data, "r") as f:
        participants_data = json.load(f)
        assert any(
            p["code"] == participant["code"] and p["locked"] is True for p in participants_data
        )


@pytest.mark.asyncio
async def test_lock_participant_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    invalid_participant_code = "invalid_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Try to lock a non-existing participant
        response = await client.post(
            f"/projects/{project_name}/participants/{invalid_participant_code}/lock"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PARTICIPANT_DOES_NOT_EXIST.format(
        code=invalid_participant_code, project_name=project_name
    )


@pytest.mark.asyncio
async def test_lock_participant_project_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    invalid_project_name = "invalid_project"
    participant_code = "test_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to lock a participant from a non-existing project
        response = await client.post(
            f"/projects/{invalid_project_name}/participants/{participant_code}/lock"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST.format(name=invalid_project_name)


@pytest.mark.asyncio
async def test_unlock_participant(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    participant = {
        "code": "test_participant",
        "name": "Test Participant",
        "notes": ["Note 1", "Note 2"],
    }

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Now create a participant
        await client.post(f"/projects/{project_name}/participants/", json=participant)

        # Lock the participant
        await client.post(f"/projects/{project_name}/participants/{participant['code']}/lock")

        # Unlock the participant
        response = await client.post(
            f"/projects/{project_name}/participants/{participant['code']}/unlock"
        )

    # Check the response
    assert response.status_code == status.HTTP_200_OK
    response_data = response.json()
    assert response_data["code"] == participant["code"]
    assert response_data["name"] == participant["name"]
    assert response_data["notes"] == participant["notes"]
    assert response_data["locked"] is False

    # Check if the participant data was updated in the storage
    participants_data = tmp_data_path / "projects" / project_name / "participants.json"
    with open(participants_data, "r") as f:
        participants_data = json.load(f)
        assert any(
            p["code"] == participant["code"] and p["locked"] is False for p in participants_data
        )


@pytest.mark.asyncio
async def test_unlock_participant_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    project_name = "test_project"
    invalid_participant_code = "invalid_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Create a project first
        await client.post("/projects/", json={"name": project_name})

        # Try to unlock a non-existing participant
        response = await client.post(
            f"/projects/{project_name}/participants/{invalid_participant_code}/unlock"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PARTICIPANT_DOES_NOT_EXIST.format(
        code=invalid_participant_code, project_name=project_name
    )


@pytest.mark.asyncio
async def test_unlock_participant_project_not_found(temp_service):
    participant_service, project_service, tmp_data_path = temp_service
    app.dependency_overrides[ProjectService] = lambda: project_service
    app.dependency_overrides[ParticipantService] = lambda: participant_service

    invalid_project_name = "invalid_project"
    participant_code = "test_participant"

    async with AsyncClient(transport=ASGITransport(app), base_url="http://test") as client:
        # Try to unlock a participant from a non-existing project
        response = await client.post(
            f"/projects/{invalid_project_name}/participants/{participant_code}/unlock"
        )

    # Check the response
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json()["detail"] == PROJECT_DOES_NOT_EXIST.format(name=invalid_project_name)
