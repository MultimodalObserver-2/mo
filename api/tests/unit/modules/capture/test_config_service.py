from api.core.plugin.plugin import PluginPublisher
from api.core.plugin.semantic_version import SemanticVersion
from api.core.plugin.sys_platform import SysPlatform
import pytest
from unittest.mock import MagicMock, patch, ANY

from api.core.api.schemas.plugin import PluginMetadata
from api.core.utils.http_exceptions import AlreadyExistsException, BadRequestException, NotFoundException
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.capture.schemas.capture_config import CaptureConfigPostReq, CaptureConfigPutReq, CaptureConfigRes
from api.modules.capture.services.config_service import CaptureConfigService


@pytest.fixture
def config_service():
    service = CaptureConfigService()
    service.project_service = MagicMock()
    service.plugin_management = MagicMock()
    service.file_management = MagicMock()
    return service


@pytest.fixture
def mock_plugin_metadata():
    metadata = PluginMetadata(
        plugin_id="test_plugin",
        name="Test Plugin",
        description="A test plugin",
        version=SemanticVersion(major=1, minor=0, patch=0),
        publisher=PluginPublisher(id="pub_id", name="Test Publisher"),
        repository="http://example.com/repo",
        platform=SysPlatform(linux=True, windows=True),
        icon_path="icon.png"
    )
    metadata._location = "/path/to/plugin"
    metadata._is_loaded = True
    return metadata


def test_add_capture_config_success(config_service, mock_plugin_metadata):
    project_name = "TestProject"
    plugin_final_id = mock_plugin_metadata.get_final_id()
    config_data = {
        "name": "TestSetting",
        "plugin_id": plugin_final_id,
        "settings": {"param": "value"}
    }
    config_req = CaptureConfigPostReq(**config_data)

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.plugin_from_type_exists.return_value = True
    config_service.plugin_management.get_plugin_metadata.return_value = mock_plugin_metadata
    config_service.file_management.exists.return_value = False
    config_service.file_management.create_directory.return_value = ""

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = False
        mock_json_storage_class.return_value = mock_storage_instance

        result = config_service.add_capture_config(
            project_name, config_req)

        assert result.name == "TestSetting"
        assert result.plugin_id == plugin_final_id
        assert result.settings == {"param": "value"}
        assert result.plugin_is_loaded is True
        config_service.project_service.exists.assert_called_with(
            project_name)
        config_service.plugin_management.plugin_from_type_exists.assert_called_with(
            plugin_final_id, CapturePlugin)
        config_service.plugin_management.validate_plugin_properties.assert_called()
        mock_storage_instance.insert_one.assert_called()


def test_add_capture_config_project_not_found(config_service):
    project_name = "NonExistentProject"
    settings_data = {"name": "TestSetting",
                     "plugin_id": "pub.plugin", "settings": {}}
    config_req = CaptureConfigPostReq(**settings_data)

    config_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        config_service.add_capture_config(
            project_name, config_req)


def test_add_capture_config_plugin_not_found(config_service):
    project_name = "TestProject"
    settings_data = {"name": "TestSetting",
                     "plugin_id": "pub.non_existent_plugin", "settings": {}}
    config_req = CaptureConfigPostReq(**settings_data)

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.plugin_from_type_exists.return_value = False

    with pytest.raises(NotFoundException):
        config_service.add_capture_config(
            project_name, config_req)


def test_add_capture_config_already_exists(config_service):
    project_name = "TestProject"
    settings_data = {"name": "ExistingSetting",
                     "plugin_id": "pub.plugin", "settings": {}}
    config_req = CaptureConfigPostReq(**settings_data)

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.plugin_from_type_exists.return_value = True

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = True
        mock_json_storage_class.return_value = mock_storage_instance

        with pytest.raises(AlreadyExistsException):
            config_service.add_capture_config(
                project_name, config_req)


def test_add_capture_config_invalid_settings_validation(config_service):
    project_name = "TestProject"
    config_req = CaptureConfigPostReq(
        name="TestSetting", plugin_id="pub.plugin", settings={"invalid": "data"})

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.plugin_from_type_exists.return_value = True
    config_service.plugin_management.validate_plugin_properties.side_effect = Exception(
        "Invalid property")

    with pytest.raises(BadRequestException):
        config_service.add_capture_config(
            project_name, config_req)


def test_add_capture_config_plugin_metadata_not_found(config_service):
    project_name = "TestProject"
    config_req = CaptureConfigPostReq(
        name="TestSetting", plugin_id="pub.plugin", settings={})

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.plugin_from_type_exists.return_value = True
    config_service.plugin_management.get_plugin_metadata.return_value = None

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = False
        mock_json_storage_class.return_value = mock_storage_instance
        with pytest.raises(NotFoundException):
            config_service.add_capture_config(
                project_name, config_req)


def test_get_all_capture_configs_success(config_service, mock_plugin_metadata):
    project_name = "TestProject"
    configs = [
        {"name": "Setting1", "plugin_id": "pub.plugin1", "settings": {}},
        {"name": "Setting2", "plugin_id": "pub.plugin2", "settings": {}}
    ]

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.get_plugin_metadata.return_value = mock_plugin_metadata

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_all.return_value = configs
        mock_json_storage_class.return_value = mock_storage_instance

        result = config_service.get_all_capture_configs(project_name)

        assert len(result) == 2
        assert result[0].name == "Setting1"
        assert result[1].plugin_id == "pub.plugin2"
        mock_storage_instance.find_all.assert_called_once()


def test_get_all_capture_configs_project_not_found(config_service):
    project_name = "NonExistentProject"
    config_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        config_service.get_all_capture_configs(project_name)


def test_get_capture_config_success(config_service, mock_plugin_metadata):
    project_name = "TestProject"
    config_name = "MySetting"
    config_dict = {"name": config_name,
                    "plugin_id": "pub.plugin1", "settings": {"key": "val"}}

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.get_plugin_metadata.return_value = mock_plugin_metadata

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_one.return_value = config_dict
        mock_json_storage_class.return_value = mock_storage_instance

        result = config_service.get_capture_config(
            project_name, config_name)

        assert result.name == config_name
        assert result.plugin_id == "pub.plugin1"
        mock_storage_instance.find_one.assert_called_with(
            {"name": config_name})


def test_get_capture_config_not_found(config_service):
    project_name = "TestProject"
    config_name = "NonExistentSetting"
    config_service.project_service.exists.return_value = True

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_one.return_value = None
        mock_json_storage_class.return_value = mock_storage_instance

        with pytest.raises(NotFoundException):
            config_service.get_capture_config(
                project_name, config_name)


def test_get_capture_config_project_not_found(config_service):
    project_name = "NonExistentProject"
    config_name = "AnySetting"
    config_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        config_service.get_capture_config(
            project_name, config_name)


def test_update_capture_config_success(config_service):
    project_name = "TestProject"
    config_name = "MySetting"
    update_data = {"name": "UpdatedSetting",
                   "settings": {"key": "new_val"}}
    update_req = CaptureConfigPutReq(**update_data)

    existing_config = CaptureConfigRes(
        name=config_name, plugin_id="pub.plugin1", settings={"key": "old_val"})

    config_service.get_capture_config = MagicMock(
        return_value=existing_config)
    config_service.exists = MagicMock(return_value=False)

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_json_storage_class.return_value = mock_storage_instance

        result = config_service.update_capture_config(
            project_name, config_name, update_req)

        assert result.name == "UpdatedSetting"
        assert result.settings == {"key": "new_val"}
        config_service.get_capture_config.assert_called_with(
            project_name, config_name)
        mock_storage_instance.update.assert_called_with(
            {"name": config_name}, ANY)


def test_update_capture_config_invalid_settings_validation(config_service):
    project_name = "TestProject"
    config_name = "MySetting"
    update_req = CaptureConfigPutReq(
        name=config_name, settings={"invalid": "data"})

    existing_config = CaptureConfigRes(
        name=config_name, plugin_id="pub.plugin1", settings={})
    config_service.get_capture_config = MagicMock(
        return_value=existing_config)
    config_service.plugin_management.validate_plugin_properties.side_effect = Exception(
        "Invalid property")

    with pytest.raises(BadRequestException):
        config_service.update_capture_config(
            project_name, config_name, update_req)


def test_update_capture_config_name_already_exists(config_service):
    project_name = "TestProject"
    config_name = "MySetting"
    update_req = CaptureConfigPutReq(name="ExistingName", settings={})

    existing_config = CaptureConfigRes(
        name=config_name, plugin_id="pub.plugin1", settings={})
    config_service.get_capture_config = MagicMock(
        return_value=existing_config)
    config_service.exists = MagicMock(return_value=True)

    with pytest.raises(AlreadyExistsException):
        config_service.update_capture_config(
            project_name, config_name, update_req)


def test_delete_capture_config_success(config_service):
    project_name = "TestProject"
    config_name = "ToDelete"

    config_service.exists = MagicMock(return_value=True)

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_json_storage_class.return_value = mock_storage_instance

        config_service.delete_capture_config(
            project_name, config_name)

        config_service.exists.assert_called_with(
            project_name, config_name)
        mock_storage_instance.delete_one.assert_called_with(
            {"name": config_name})


def test_delete_capture_config_not_found(config_service):
    project_name = "TestProject"
    config_name = "NonExistent"
    config_service.exists = MagicMock(return_value=False)

    with pytest.raises(NotFoundException):
        config_service.delete_capture_config(
            project_name, config_name)


def test_get_all_configs_loaded_success(config_service, mock_plugin_metadata):
    project_name = "TestProject"

    unloaded_metadata = mock_plugin_metadata.model_copy()
    unloaded_metadata.plugin_id = "unloaded_plugin"
    unloaded_metadata._is_loaded = False

    settings_list = [
        {"name": "Loaded", "plugin_id": mock_plugin_metadata.get_final_id(),
         "settings": {}},
        {"name": "Unloaded", "plugin_id": unloaded_metadata.get_final_id(),
         "settings": {}}
    ]

    config_service.project_service.exists.return_value = True
    config_service.plugin_management.get_plugin_metadata.side_effect = [
        mock_plugin_metadata, unloaded_metadata]

    with patch('api.modules.capture.services.config_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_all.return_value = settings_list
        mock_json_storage_class.return_value = mock_storage_instance

        result = config_service.get_all_configs_loaded(
            project_name)

        assert len(result) == 1
        assert result[0].name == "Loaded"
        assert result[0].plugin_id == mock_plugin_metadata.get_final_id()


def test_get_all_configs_loaded_project_not_found(config_service):
    project_name = "NonExistentProject"
    config_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        config_service.get_all_configs_loaded(project_name)


def test_exists_project_not_found(config_service):
    project_name = "NonExistentProject"
    config_name = "AnySetting"
    config_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        config_service.exists(project_name, config_name)
