from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from api.core.utils.http_exceptions import (AlreadyExistsException,
                                            BadRequestException,
                                            NotFoundException)
from api.modules.organization.schemas.participant import (ParticipantPostReq,
                                                          ParticipantPutReq,
                                                          ParticipantRes)
from api.modules.organization.services.participant_service import \
    ParticipantService


@pytest.fixture
def participant_service():
    service = ParticipantService()

    service.file_management = MagicMock()
    service.project_service = MagicMock()
    return service


def test_create_participant_success(participant_service):
    participant_service.exists = MagicMock(return_value=False)
    participant_service.file_management.create_directory.return_value = "/path/to/participant"

    with (
        patch(
            "api.modules.organization.services.participant_service.FileValidators.is_valid_directory_name"
        ) as mock_is_valid_directory_name,
        patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage,
    ):

        mock_is_valid_directory_name.return_value = True
        mock_storage = MockStorage
        mock_storage.insert_one = MagicMock()
        MockStorage.return_value = mock_storage

        participant_req = ParticipantPostReq(code="P001", name="Participant One", notes=["Notes"])
        result = participant_service.create_participant("TestProject", participant_req)

        assert result.code == "P001"
        mock_storage.insert_one.assert_called()


def test_create_participant_already_exists(participant_service):
    participant_service.exists = MagicMock(return_value=True)

    participant_req = ParticipantPostReq(code="P001", name="Test", notes=["Notes"])

    with pytest.raises(AlreadyExistsException):
        participant_service.create_participant("TestProject", participant_req)


def test_create_participant_invalid_code(participant_service):
    participant_service.exists = MagicMock(return_value=False)
    with patch(
        "api.modules.organization.services.participant_service.FileValidators.is_valid_directory_name",
        return_value=False,
    ):
        participant_req = ParticipantPostReq(code="Invalid/Code", name="Test", notes=["Notes"])

        with pytest.raises(BadRequestException):
            participant_service.create_participant("TestProject", participant_req)


def test_get_all_participants_success(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    participant_service.project_service.exists.return_value = True

    with patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.find_all.return_value = [participant]
        MockStorage.return_value = mock_storage

        result = participant_service.get_all_participants("TestProject")

        assert len(result) == 1
        assert result[0].code == "P001"


def test_get_all_participants_not_found(participant_service):
    participant_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        participant_service.get_all_participants("UnknownProject")


def test_get_participant_success(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    participant_service.project_service.exists.return_value = True

    with patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.find_one.return_value = participant
        MockStorage.return_value = mock_storage

        result = participant_service.get_participant("TestProject", "P001")

        assert result.code == "P001"


def test_get_participant_not_found(participant_service):
    participant_service.project_service.exists.return_value = True

    with patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.find_one.return_value = None
        MockStorage.return_value = mock_storage

        with pytest.raises(NotFoundException):
            participant_service.get_participant("TestProject", "UnknownParticipant")


def test_get_participant_project_not_found(participant_service):
    participant_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        participant_service.get_participant("UnknownProject", "P001")


def test_update_participant_success(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    participant_service.get_participant = MagicMock(return_value=ParticipantRes(**participant))
    participant_service.is_participant_locked = MagicMock(return_value=False)
    participant_service.exists = MagicMock(return_value=False)
    participant_service.file_management.rename_directory.return_value = "/new/path"

    with (
        patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage,
        patch(
            "api.modules.organization.services.participant_service.FileValidators.is_valid_directory_name",
            return_value=True,
        ),
    ):

        mock_storage = MockStorage()
        mock_storage.update = MagicMock()
        MockStorage.return_value = mock_storage

        participant_put = ParticipantPutReq(code="P002", name="New", notes=["Updated"])
        result = participant_service.update_participant("TestProject", "P001", participant_put)

        assert result.code == "P002"


def test_update_participant_locked(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": True,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    participant_service.get_participant = MagicMock(return_value=ParticipantRes(**participant))
    participant_service.is_participant_locked = MagicMock(return_value=True)

    with pytest.raises(BadRequestException):
        participant_service.update_participant(
            "TestProject", "P001", ParticipantPutReq(code="P002")
        )


def test_update_participant_invalid_code(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    participant_service.get_participant = MagicMock(return_value=ParticipantRes(**participant))
    participant_service.is_participant_locked = MagicMock(return_value=False)
    participant_service.exists = MagicMock(return_value=False)

    with patch(
        "api.modules.organization.services.participant_service.FileValidators.is_valid_directory_name",
        return_value=False,
    ):
        with pytest.raises(BadRequestException):
            participant_service.update_participant(
                "TestProject", "P001", ParticipantPutReq(code="Invalid/Code")
            )


def test_update_participant_already_exists(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    participant_service.get_participant = MagicMock(return_value=ParticipantRes(**participant))
    participant_service.is_participant_locked = MagicMock(return_value=False)
    participant_service.exists = MagicMock(return_value=True)

    with pytest.raises(AlreadyExistsException):
        participant_service.update_participant(
            "TestProject", "P001", ParticipantPutReq(code="P002")
        )


def test_delete_participant_success(participant_service):
    participant_service.exists = MagicMock(return_value=True)
    participant_service.is_participant_locked = MagicMock(return_value=False)

    with patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.delete_one = MagicMock()
        MockStorage.return_value = mock_storage

        participant_service.delete_participant("TestProject", "P001")

        mock_storage.delete_one.assert_called()


def test_delete_participant_not_found(participant_service):
    participant_service.exists = MagicMock(return_value=False)

    with pytest.raises(NotFoundException):
        participant_service.delete_participant("TestProject", "UnknownParticipant")


def test_delete_participant_locked(participant_service):
    participant_service.exists = MagicMock(return_value=True)
    participant_service.is_participant_locked = MagicMock(return_value=True)

    with pytest.raises(BadRequestException):
        participant_service.delete_participant("TestProject", "P001")


def test_lock_participant(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

    participant_data = participant.copy()
    participant_service.get_participant = MagicMock(return_value=ParticipantRes(**participant_data))

    with patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.update = MagicMock()
        MockStorage.return_value = mock_storage

        locked = participant_service.lock_participant("TestProject", "P001")
        assert locked.locked is True


def test_lock_participant_not_found(participant_service):
    participant_service.get_participant = MagicMock(return_value=None)

    with pytest.raises(NotFoundException):
        participant_service.lock_participant("TestProject", "UnknownParticipant")


def test_unlock_participant(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

    participant_data = participant.copy()
    participant_service.get_participant = MagicMock(return_value=ParticipantRes(**participant_data))

    with patch("api.modules.organization.services.participant_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.update = MagicMock()
        MockStorage.return_value = mock_storage

        unlocked = participant_service.unlock_participant("TestProject", "P001")
        assert unlocked.locked is False


def test_unlock_participant_not_found(participant_service):
    participant_service.get_participant = MagicMock(return_value=None)

    with pytest.raises(NotFoundException):
        participant_service.unlock_participant("TestProject", "UnknownParticipant")


def test_is_participant_locked(participant_service):
    participant = {
        "code": "P001",
        "name": "Participant One",
        "notes": ["Test notes"],
        "location": "/path/to/participant[P001]",
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }
    participant_data = {**participant, "locked": True}
    participant_service.get_participant = MagicMock(return_value=ParticipantRes(**participant_data))

    assert participant_service.is_participant_locked("TestProject", "P001") is True


def test_is_participant_locked_not_found(participant_service):
    participant_service.get_participant = MagicMock(return_value=None)

    with pytest.raises(NotFoundException):
        participant_service.is_participant_locked("TestProject", "UnknownParticipant")


def test_is_participant_locked_project_not_found(participant_service):
    participant_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        participant_service.is_participant_locked("UnknownProject", "P001")


def test_exists(participant_service):
    participant_service.project_service.exists = MagicMock(return_value=True)
    participant_service._get_participants_storage = MagicMock()
    participant_service._get_participants_storage.return_value = MagicMock()
    participant_service._get_participants_storage.return_value.exists.return_value = True
    assert participant_service.exists("TestProject", "P001") is True


def test_exists_not_found(participant_service):
    participant_service.project_service.exists = MagicMock(return_value=True)
    participant_service._get_participants_storage = MagicMock()
    participant_service._get_participants_storage.return_value = MagicMock()
    participant_service._get_participants_storage.return_value.exists.return_value = False
    assert participant_service.exists("TestProject", "UnknownParticipant") is False


def test_exists_project_not_found(participant_service):
    participant_service.project_service.exists = MagicMock(return_value=False)

    with pytest.raises(NotFoundException):
        participant_service.exists("UnknownProject", "P001")
