import pytest
from unittest.mock import MagicMock, patch, ANY
from datetime import datetime

from api.core.utils.http_exceptions import BadRequestException, NotFoundException
from api.modules.capture.schemas.session import CaptureSettingDetails, CaptureSettingDetailsPost, CaptureSettingDetailsPut, SessionData, SessionPost, SessionPut, SessionRes
from api.modules.capture.services.session_service import SessionService


@pytest.fixture
def session_service():
    service = SessionService()
    service.project_service = MagicMock()
    service.participant_service = MagicMock()
    service.plugin_service = MagicMock()
    service.file_management = MagicMock()
    return service


@pytest.fixture
def mock_participant():
    participant = MagicMock()
    participant.location = "/path/to/project/participant_01"
    return participant


@pytest.fixture
def mock_session_data():
    return SessionData(
        session_id="session[2025-06-06_18-30-00]",
        rel_location="session[2025-06-06_18-30-00]",
        start_timestamp=1749268200.0,
        started_at=datetime(2025, 6, 6, 18, 30, 0),
        capture_sources=[
            CaptureSettingDetails(
                setting_name="test_setting",
                plugin_id="pub.plugin",
                plugin_name="Test",
                plugin_version="1.0",
                settings={},
                rel_location="session[2025-06-06_18-30-00]/data.dat",
                file_extension="dat"
            )
        ]
    )


def test_create_session_success(session_service, mock_participant):
    project_name = "TestProject"
    participant_code = "P01"
    now = datetime(2025, 6, 6, 18, 30, 0)
    session_post = SessionPost(
        start_timestamp=1749268200.0,
        started_at=now,
        capture_sources=[
            CaptureSettingDetailsPost(setting_name="test_setting", plugin_id="pub.plugin", plugin_name="Test",
                                      plugin_version="1.0", settings={}, file_name="data", file_extension="dat")
        ]
    )
    expected_session_id = "session[2025-06-06_18.30.00]"

    session_service.participant_service.get_participant.return_value = mock_participant
    session_service.project_service.get_rel_project_location.return_value = "TestProject"
    session_service.participant_service._get_participant_dir_name.return_value = "P01"
    SessionRes.from_session_data = MagicMock()

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_json_storage.return_value = mock_storage_instance

        session_service.create_session(
            project_name, participant_code, session_post)

        session_service.participant_service.get_participant.assert_called_with(
            project_name, participant_code)
        session_service.file_management.create_directory.assert_called_with(
            expected_session_id, mock_participant.location)
        mock_storage_instance.insert_one.assert_called_once()
        SessionRes.from_session_data.assert_called_once()


def test_update_session_success(session_service, mock_session_data):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = mock_session_data.session_id
    session_put = SessionPut(end_timestamp=1749268800.0, capture_sources=[
        CaptureSettingDetailsPut(
            setting_name="test_setting", start_timestamp=1749268300.0
        )
    ])

    session_service._get_session_data = MagicMock(
        return_value=mock_session_data)
    session_service.project_service.get_rel_project_location.return_value = project_name
    session_service.participant_service._get_participant_dir_name.return_value = participant_code
    SessionRes.from_session_data = MagicMock()

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_json_storage.return_value = mock_storage_instance

        session_service.update_session(
            project_name, participant_code, session_id, session_put)

        session_service._get_session_data.assert_called_with(
            project_name, participant_code, session_id)
        mock_storage_instance.update.assert_called_with(
            {"session_id": session_id}, ANY)
        updated_data = mock_storage_instance.update.call_args[0][1]
        assert updated_data["end_timestamp"] == session_put.end_timestamp
        SessionRes.from_session_data.assert_called_once()


def test_add_capture_source_setting_start_timestamp_success(session_service, mock_session_data):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = mock_session_data.session_id
    setting_name = "test_setting"
    new_timestamp = 1749268300.0

    session_service._get_session_data = MagicMock(
        return_value=mock_session_data)

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_json_storage.return_value = mock_storage_instance

        result = session_service.add_capture_source_setting_start_timestamp(
            project_name, participant_code, session_id, setting_name, new_timestamp
        )

        assert result.capture_sources[0].start_timestamp == new_timestamp
        mock_storage_instance.update.assert_called_with(
            {"session_id": session_id}, result.model_dump())


def test_add_end_timestamp_success(session_service, mock_session_data):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = mock_session_data.session_id
    end_timestamp = 1749268800.0

    session_service._get_session_data = MagicMock(
        return_value=mock_session_data)

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_json_storage.return_value = mock_storage_instance

        result = session_service.add_end_timestamp(
            project_name, participant_code, session_id, end_timestamp)

        assert result.end_timestamp == end_timestamp
        mock_storage_instance.update.assert_called_with(
            {"session_id": session_id}, result.model_dump())


def test_get_all_sessions_success(session_service, mock_participant):
    project_name = "TestProject"
    participant_code = "P01"

    session_dict_1 = {
        "session_id": "s1",
        "rel_location": "location1",
        "start_timestamp": 1749268200.0,
        "started_at": datetime(2025, 6, 6, 18, 30, 0),
        "capture_sources": []
    }
    session_dict_2 = {
        "session_id": "s2",
        "rel_location": "location2",
        "start_timestamp": 1749268300.0,
        "started_at": datetime(2025, 6, 6, 18, 31, 40),
        "capture_sources": []
    }

    session_service.project_service.exists.return_value = True
    session_service.participant_service.exists.return_value = True
    session_service.participant_service.get_participant.return_value = mock_participant
    SessionRes.from_session_data = MagicMock()

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_all.return_value = [
            session_dict_1, session_dict_2
        ]
        mock_json_storage.return_value = mock_storage_instance

        result = session_service.get_all_sessions(
            project_name, participant_code)

        assert len(result) == 2
        mock_storage_instance.find_all.assert_called_once()
        assert SessionRes.from_session_data.call_count == 2


def test_get_all_sessions_project_not_found(session_service):
    project_name = "NonExistentProject"
    participant_code = "P01"

    session_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        session_service.get_all_sessions(project_name, participant_code)


def test_get_all_sessions_participant_not_found(session_service):
    project_name = "TestProject"
    participant_code = "NonExistentP"

    session_service.project_service.exists.return_value = True
    session_service.participant_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        session_service.get_all_sessions(project_name, participant_code)


def test_get_session_success(session_service, mock_session_data):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = mock_session_data.session_id

    session_service._get_session_data = MagicMock(
        return_value=mock_session_data)
    SessionRes.from_session_data = MagicMock()

    session_service.get_session(project_name, participant_code, session_id)

    session_service._get_session_data.assert_called_with(
        project_name, participant_code, session_id)
    SessionRes.from_session_data.assert_called_with(
        mock_session_data, ANY, ANY)


def test_get_session_not_found(session_service):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = "nonexistent_session"

    session_service._get_session_data = MagicMock(
        side_effect=NotFoundException)

    with pytest.raises(NotFoundException):
        session_service.get_session(project_name, participant_code, session_id)


def test_delete_session_success(session_service):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = "session_to_delete"
    mock_session_res = MagicMock()
    mock_session_res.location = "/path/to/session"

    session_service.get_session = MagicMock(return_value=mock_session_res)
    session_service.participant_service.is_participant_locked.return_value = False

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_json_storage.return_value = mock_storage_instance

        session_service.delete_session(
            project_name, participant_code, session_id)

        session_service.get_session.assert_called_with(
            project_name, participant_code, session_id)
        session_service.file_management.send_to_trash.assert_called_with(
            mock_session_res.location)
        mock_storage_instance.delete_one.assert_called_with(
            {"session_id": session_id})


def test_delete_session_participant_locked(session_service):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = "session_to_delete"
    mock_session_res = MagicMock()

    session_service.get_session = MagicMock(return_value=mock_session_res)
    session_service.participant_service.is_participant_locked.return_value = True

    with pytest.raises(BadRequestException):
        session_service.delete_session(
            project_name, participant_code, session_id)


def test_exists_true(session_service, mock_participant):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = "existing_session"

    session_service.participant_service.get_participant.return_value = mock_participant

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = True
        mock_json_storage.return_value = mock_storage_instance

        result = session_service.exists(
            project_name, participant_code, session_id)
        assert result is True


def test_get_session_data_success(session_service, mock_session_data):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = mock_session_data.session_id

    session_service._get_session_storage = MagicMock()
    session_service._get_session_storage.return_value.find_one.return_value = mock_session_data.model_dump()

    result = session_service._get_session_data(
        project_name, participant_code, session_id)

    assert result == mock_session_data
    session_service._get_session_storage.assert_called_with(
        project_name, participant_code)


def test_get_session_data_not_found(session_service):
    project_name = "TestProject"
    participant_code = "P01"
    session_id = "nonexistent_session"

    with patch('api.modules.capture.services.session_service.JsonStorage') as mock_json_storage:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_one.return_value = None
        mock_json_storage.return_value = mock_storage_instance
        session_service._get_session_storage = MagicMock(
            return_value=mock_storage_instance)

        with pytest.raises(NotFoundException):
            session_service._get_session_data(
                project_name, participant_code, session_id)
