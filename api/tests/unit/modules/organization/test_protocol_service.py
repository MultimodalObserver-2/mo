from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

from mo.core.file_management.file_management import FileManagement
from mo.core.utils.http_exceptions import (
    AlreadyExistsException,
    BadRequestException,
    NotFoundException,
)
from mo.modules.organization.schemas.protocol import (
    ActivityPostReq,
    ProtocolPostReq,
    ProtocolPutReq,
    ProtocolRes,
)
from mo.modules.organization.services.protocol_service import ProtocolService


@pytest.fixture
def protocol_service():
    service = ProtocolService()
    service.project_service = MagicMock()
    service.file_management = MagicMock()
    return service


def test_create_protocol_success(protocol_service):
    protocol_service.exists = MagicMock(return_value=False)
    protocol_service._validate_and_format_activities = MagicMock(return_value=[])

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.insert_one = MagicMock()
        MockStorage.return_value = mock_storage

        req = ProtocolPostReq(name="Protocol A", activities=[])
        result = protocol_service.create_protocol("TestProject", req)

        assert result.name == "Protocol A"
        mock_storage.insert_one.assert_called()


def test_create_protocol_already_exists(protocol_service):
    protocol_service.exists = MagicMock(return_value=True)

    req = ProtocolPostReq(name="Protocol A", activities=[])

    with pytest.raises(AlreadyExistsException):
        protocol_service.create_protocol("TestProject", req)


def test_get_all_protocols_success(protocol_service):
    protocol_service.project_service.exists.return_value = True

    data = [
        {
            "name": "Protocol A",
            "activities": [],
            "locked": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }
    ]

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.find_all.return_value = data
        MockStorage.return_value = mock_storage

        result = protocol_service.get_all_protocols("TestProject")

        assert len(result) == 1
        assert result[0].name == "Protocol A"


def test_get_all_protocols_project_not_found(protocol_service):
    protocol_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        protocol_service.get_all_protocols("UnknownProject")


def test_get_protocol_success(protocol_service):
    protocol_service.project_service.exists.return_value = True

    protocol_data = {
        "name": "Protocol A",
        "activities": [],
        "locked": False,
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
    }

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.find_one.return_value = protocol_data
        MockStorage.return_value = mock_storage

        result = protocol_service.get_protocol("TestProject", "Protocol A")

        assert result.name == "Protocol A"


def test_get_protocol_not_found(protocol_service):
    protocol_service.project_service.exists.return_value = True

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.find_one.return_value = None
        MockStorage.return_value = mock_storage

        with pytest.raises(NotFoundException):
            protocol_service.get_protocol("TestProject", "NonExistent")


def test_get_protocol_project_not_found(protocol_service):
    protocol_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        protocol_service.get_protocol("UnknownProject", "Protocol A")


def test_update_protocol_success(protocol_service):
    protocol_service.get_protocol = MagicMock()
    protocol_service.exists = MagicMock(return_value=False)
    protocol_service._validate_and_format_activities = MagicMock(return_value=[])
    protocol_service.is_protocol_locked = MagicMock(return_value=False)

    mock_protocol = ProtocolRes(
        uuid="12345",
        name="Protocol A",
        activities=[],
        locked=False,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    protocol_service.get_protocol.return_value = mock_protocol

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.update = MagicMock()
        MockStorage.return_value = mock_storage

        req = ProtocolPutReq(name="Protocol A", activities=[])
        result = protocol_service.update_protocol("TestProject", "Protocol A", req)

        assert result.name == "Protocol A"
        mock_storage.update.assert_called()


def test_update_protocol_locked(protocol_service):
    protocol_service.is_protocol_locked = MagicMock(return_value=True)
    protocol_service.get_protocol = MagicMock()

    with pytest.raises(BadRequestException):
        protocol_service.update_protocol(
            "TestProject", "Protocol A", ProtocolPutReq(name="New", activities=[])
        )


def test_update_protocol_already_exists(protocol_service):
    protocol_service.get_protocol = MagicMock()
    protocol_service.is_protocol_locked = MagicMock(return_value=False)
    protocol_service.exists = MagicMock(return_value=True)

    with pytest.raises(AlreadyExistsException):
        protocol_service.update_protocol(
            "TestProject", "Protocol A", ProtocolPutReq(name="New name", activities=[])
        )


def test_delete_protocol_success(protocol_service):
    protocol_service.exists = MagicMock(return_value=True)
    protocol_service.is_protocol_locked = MagicMock(return_value=False)

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.delete_one = MagicMock()
        MockStorage.return_value = mock_storage

        protocol_service.delete_protocol("TestProject", "Protocol A")

        mock_storage.delete_one.assert_called_with({"name": "Protocol A"})


def test_delete_protocol_locked(protocol_service):
    protocol_service.exists = MagicMock(return_value=True)
    protocol_service.is_protocol_locked = MagicMock(return_value=True)

    with pytest.raises(BadRequestException):
        protocol_service.delete_protocol("TestProject", "Protocol A")


def test_delete_protocol_not_found(protocol_service):
    protocol_service.exists = MagicMock(return_value=False)

    with pytest.raises(NotFoundException):
        protocol_service.delete_protocol("TestProject", "Protocol A")


def test_lock_protocol_success(protocol_service):
    protocol_service.get_protocol = MagicMock()
    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.update = MagicMock()
        MockStorage.return_value = mock_storage

        protocol = ProtocolRes(
            uuid="12345",
            name="Protocol A",
            activities=[],
            locked=False,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        protocol_service.get_protocol.return_value = protocol
        result = protocol_service.lock_protocol("TestProject", "Protocol A")

        assert result.locked is True


def test_unlock_protocol_success(protocol_service):
    protocol_service.get_protocol = MagicMock()
    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.update = MagicMock()
        MockStorage.return_value = mock_storage

        protocol = ProtocolRes(
            uuid="12345",
            name="Protocol A",
            activities=[],
            locked=True,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        protocol_service.get_protocol.return_value = protocol
        result = protocol_service.unlock_protocol("TestProject", "Protocol A")

        assert result.locked is False


def test_is_protocol_locked_success(protocol_service):
    protocol_service.get_protocol = MagicMock()
    protocol_service.get_protocol.return_value = ProtocolRes(
        uuid="12345",
        name="Protocol A",
        activities=[],
        locked=True,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    result = protocol_service.is_protocol_locked("TestProject", "Protocol A")
    assert result is True


def test_is_protocol_locked_not_found(protocol_service):
    protocol_service.get_protocol = MagicMock()
    protocol_service.get_protocol.return_value = None

    with pytest.raises(NotFoundException):
        protocol_service.is_protocol_locked("TestProject", "Protocol A")


def test_exists_true(protocol_service):
    protocol_service.project_service.exists.return_value = True

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.exists.return_value = True
        MockStorage.return_value = mock_storage

        assert protocol_service.exists("TestProject", "Protocol A") is True


def test_exists_false(protocol_service):
    protocol_service.project_service.exists.return_value = True

    with patch("mo.modules.organization.services.protocol_service.JsonStorage") as MockStorage:
        mock_storage = MockStorage()
        mock_storage.exists.return_value = False
        MockStorage.return_value = mock_storage

        assert protocol_service.exists("TestProject", "Protocol A") is False


def test_exists_project_not_found(protocol_service):
    protocol_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        protocol_service.exists("UnknownProject", "Protocol A")


def test_validate_and_format_activities_success(protocol_service):
    activity = ActivityPostReq(
        name="TestActivity",
        path=None,
        has_time_limit=False,
        time_limit=0,
        start_message="start",
        end_message="end",
        close_activity=False,
        process_name=None,
        show_timer=True,
    )

    FileManagement.is_file = MagicMock(return_value=True)

    result = protocol_service._validate_and_format_activities([activity], "Protocol A")

    assert result[0].name == "TestActivity"
    assert result[0].order == 1


def test_validate_and_format_activities_invalid_path(protocol_service):
    activity = ActivityPostReq(
        name="Activity",
        path="/invalid/path",
        has_time_limit=False,
        time_limit=0,
        start_message="start",
        end_message="end",
        close_activity=False,
        process_name=None,
        show_timer=True,
    )

    FileManagement.is_file = MagicMock(return_value=False)

    with pytest.raises(BadRequestException) as exc:
        protocol_service._validate_and_format_activities([activity], "Protocol X")


def test_validate_and_format_activities_invalid_time(protocol_service):
    activity = ActivityPostReq(
        name="Activity",
        path=None,
        has_time_limit=True,
        time_limit=0,
        start_message="start",
        end_message="end",
        close_activity=False,
        process_name=None,
        show_timer=True,
    )

    FileManagement.is_file = MagicMock(return_value=True)

    with pytest.raises(BadRequestException) as exc:
        protocol_service._validate_and_format_activities([activity], "Protocol X")


def test_validate_and_format_activities_missing_process_name(protocol_service):
    activity = ActivityPostReq(
        name="Activity",
        path=None,
        has_time_limit=False,
        time_limit=0,
        start_message="start",
        end_message="end",
        close_activity=True,
        process_name=None,
        show_timer=True,
    )

    FileManagement.is_file = MagicMock(return_value=True)

    with pytest.raises(BadRequestException) as exc:
        protocol_service._validate_and_format_activities([activity], "Protocol X")
