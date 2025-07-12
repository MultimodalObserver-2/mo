from mo.modules.visualization.services.playback_config import PlaybackConfigService
from mo.modules.visualization.schemas.playback_config import PlaybackConfigPostReq, PlaybackConfigPutReq
import pytest
from unittest.mock import MagicMock, patch

from mo.core.utils.http_exceptions import AlreadyExistsException, NotFoundException


@pytest.fixture
def playback_service():
    service = PlaybackConfigService()
    service.project_service = MagicMock()
    service.plugin_management = MagicMock()
    service.file_management = MagicMock()
    return service


@pytest.fixture
def playback_post_req():
    return PlaybackConfigPostReq(
        name="PlaybackOne",
        plugin_id="plugin.abc",
        capture_config_id="capture.123",
        settings={"foo": "bar"}
    )


@pytest.fixture
def playback_put_req():
    return PlaybackConfigPutReq(
        name="PlaybackOneUpdated",
        capture_config_id="capture.456",
        settings={"foo": "baz"}
    )


def test_add_playback_config_success(playback_service, playback_post_req):
    playback_service.project_service.exists.return_value = True

    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = False
        mock_json_storage_class.return_value = mock_storage_instance

        result = playback_service.add_playback_config(
            "TestProject", playback_post_req)

        assert result.name == playback_post_req.name
        assert result.plugin_id == playback_post_req.plugin_id
        assert result.capture_config_id == playback_post_req.capture_config_id
        assert result.settings == playback_post_req.settings
        mock_storage_instance.insert_one.assert_called()


def test_add_playback_config_already_exists(playback_service, playback_post_req):
    playback_service.project_service.exists.return_value = True
    playback_service.exists = MagicMock(return_value=True)

    with pytest.raises(AlreadyExistsException):
        playback_service.add_playback_config("TestProject", playback_post_req)


def test_add_playback_config_project_not_found(playback_service, playback_post_req):
    playback_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        playback_service.add_playback_config(
            "MissingProject", playback_post_req)


def test_get_all_playback_configs_success(playback_service):
    playback_service.project_service.exists.return_value = True
    fake_data = [{
        "id": "uuid-1",
        "name": "PlaybackOne",
        "plugin_id": "plugin.abc",
        "capture_config_id": "capture.123",
        "settings": {"foo": "bar"},
    }]
    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_all.return_value = fake_data
        mock_json_storage_class.return_value = mock_storage_instance

        result = playback_service.get_all_playback_configs("TestProject")
        assert len(result) == 1
        assert result[0].name == "PlaybackOne"


def test_get_all_playback_configs_project_not_found(playback_service):
    playback_service.project_service.exists.return_value = False
    with pytest.raises(NotFoundException):
        playback_service.get_all_playback_configs("MissingProject")


def test_get_playback_config_success(playback_service):
    playback_service.project_service.exists.return_value = True
    fake_data = {
        "id": "uuid-1",
        "name": "PlaybackOne",
        "plugin_id": "plugin.abc",
        "capture_config_id": "capture.123",
        "settings": {"foo": "bar"},
    }
    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_one.return_value = fake_data
        mock_json_storage_class.return_value = mock_storage_instance

        result = playback_service.get_playback_config(
            "TestProject", "PlaybackOne")
        assert result.name == "PlaybackOne"
        assert result.plugin_id == "plugin.abc"


def test_get_playback_config_not_found(playback_service):
    playback_service.project_service.exists.return_value = True
    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_one.return_value = None
        mock_json_storage_class.return_value = mock_storage_instance

        with pytest.raises(NotFoundException):
            playback_service.get_playback_config(
                "TestProject", "MissingConfig")


def test_get_playback_config_project_not_found(playback_service):
    playback_service.project_service.exists.return_value = False
    with pytest.raises(NotFoundException):
        playback_service.get_playback_config("MissingProject", "AnyConfig")


def test_update_playback_config_success(playback_service, playback_put_req):
    existing = MagicMock()
    existing.id = "uuid-1"
    existing.name = "PlaybackOne"
    existing.plugin_id = "plugin.abc"
    existing.capture_config_id = "capture.123"
    existing.settings = {"foo": "bar"}
    playback_service.get_playback_config = MagicMock(return_value=existing)
    playback_service.exists = MagicMock(return_value=False)

    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_json_storage_class.return_value = mock_storage_instance

        result = playback_service.update_playback_config(
            "TestProject", "PlaybackOne", playback_put_req
        )
        assert result.name == "PlaybackOneUpdated"
        assert result.settings == {"foo": "baz"}
        mock_storage_instance.update.assert_called()


def test_update_playback_config_name_already_exists(playback_service, playback_put_req):
    existing = MagicMock()
    existing.id = "uuid-1"
    existing.name = "PlaybackOne"
    existing.plugin_id = "plugin.abc"
    existing.capture_config_id = "capture.123"
    existing.settings = {"foo": "bar"}
    playback_service.get_playback_config = MagicMock(return_value=existing)
    playback_service.exists = MagicMock(return_value=True)

    with pytest.raises(AlreadyExistsException):
        playback_service.update_playback_config(
            "TestProject", "PlaybackOne", playback_put_req)


def test_delete_playback_config_success(playback_service):
    playback_service.exists = MagicMock(return_value=True)
    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_json_storage_class.return_value = mock_storage_instance

        playback_service.delete_playback_config("TestProject", "PlaybackOne")
        mock_storage_instance.delete_one.assert_called_with(
            {"name": "PlaybackOne"})


def test_delete_playback_config_not_found(playback_service):
    playback_service.exists = MagicMock(return_value=False)
    with pytest.raises(NotFoundException):
        playback_service.delete_playback_config("TestProject", "MissingConfig")


def test_exists_true(playback_service):
    playback_service.project_service.exists.return_value = True
    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = True
        mock_json_storage_class.return_value = mock_storage_instance

        result = playback_service.exists("TestProject", "PlaybackOne")
        assert result is True


def test_exists_false(playback_service):
    playback_service.project_service.exists.return_value = True
    with patch("mo.modules.visualization.services.playback_config.JsonStorage") as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = False
        mock_json_storage_class.return_value = mock_storage_instance

        result = playback_service.exists("TestProject", "PlaybackOne")
        assert result is False


def test_exists_project_not_found(playback_service):
    playback_service.project_service.exists.return_value = False
    with pytest.raises(NotFoundException):
        playback_service.exists("MissingProject", "AnyConfig")


def test_save_playback_layout_success(playback_service):
    playback_service.project_service.exists.return_value = True
    playback_service._get_configurations_dir_path = MagicMock(
        return_value="/some/path")

    playback_service.file_management.create_json_file = MagicMock()

    playback_service.save_playback_layout("TestProject", {"layout": [1, 2, 3]})

    playback_service.file_management.create_json_file.assert_called_once_with(
        playback_service._layout_file_name, {"layout": [1, 2, 3]}, "/some/path"
    )


def test_save_playback_layout_project_not_found(playback_service):
    playback_service.project_service.exists.return_value = False
    with pytest.raises(NotFoundException):
        playback_service.save_playback_layout("MissingProject", {})


def test_get_playback_layout_success(playback_service):
    playback_service.project_service.exists.return_value = True
    playback_service._get_configurations_dir_path = MagicMock(
        return_value="/some/path")
    playback_service.file_management.exists.return_value = True
    playback_service.file_management.read_json_file = MagicMock(
        return_value={"layout": [1, 2, 3]})

    result = playback_service.get_playback_layout("TestProject")
    assert result == {"layout": [1, 2, 3]}


def test_get_playback_layout_project_not_found(playback_service):
    playback_service.project_service.exists.return_value = False
    with pytest.raises(NotFoundException):
        playback_service.get_playback_layout("MissingProject")


def test_get_playback_layout_file_not_found(playback_service):
    playback_service.project_service.exists.return_value = True
    playback_service._get_configurations_dir_path = MagicMock(
        return_value="/some/path")
    playback_service.file_management.exists.return_value = False

    playback_service.file_management.create_json_file = MagicMock()
    playback_service.file_management.read_json_file = MagicMock(
        return_value={})

    result = playback_service.get_playback_layout("TestProject")
    assert result == {}
    playback_service.file_management.create_json_file.assert_called_once()
    playback_service.file_management.read_json_file.assert_called_once()
