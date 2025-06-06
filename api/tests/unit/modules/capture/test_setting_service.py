from api.core.plugin.plugin import PluginPublisher
from api.core.plugin.semantic_version import SemanticVersion
from api.core.plugin.sys_platform import SysPlatform
import pytest
from unittest.mock import MagicMock, patch, ANY

from api.core.api.schemas.plugin import PluginMetadata
from api.core.utils.http_exceptions import AlreadyExistsException, BadRequestException, NotFoundException
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.capture.schemas.settings import SettingsPostReq, SettingsPutReq, SettingsRes
from api.modules.capture.services.setting_service import CaptureSettingService


@pytest.fixture
def setting_service():
    service = CaptureSettingService()
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


def test_add_capture_settings_success(setting_service, mock_plugin_metadata):
    project_name = "TestProject"
    plugin_final_id = mock_plugin_metadata.get_final_id()
    settings_data = {
        "name": "TestSetting",
        "plugin_id": plugin_final_id,
        "settings": {"param": "value"}
    }
    settings_req = SettingsPostReq(**settings_data)

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.plugin_from_type_exists.return_value = True
    setting_service.plugin_management.get_plugin_metadata.return_value = mock_plugin_metadata
    setting_service.file_management.exists.return_value = False
    setting_service.file_management.create_directory.return_value = ""

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = False
        mock_json_storage_class.return_value = mock_storage_instance

        result = setting_service.add_capture_settings(
            project_name, settings_req)

        assert result.name == "TestSetting"
        assert result.plugin_id == plugin_final_id
        assert result.settings == {"param": "value"}
        assert result.plugin_is_loaded is True
        setting_service.project_service.exists.assert_called_with(
            project_name)
        setting_service.plugin_management.plugin_from_type_exists.assert_called_with(
            plugin_final_id, CapturePlugin)
        setting_service.plugin_management.validate_plugin_properties.assert_called()
        mock_storage_instance.insert_one.assert_called()


def test_add_capture_settings_project_not_found(setting_service):
    project_name = "NonExistentProject"
    settings_data = {"name": "TestSetting",
                     "plugin_id": "pub.plugin", "settings": {}}
    settings_req = SettingsPostReq(**settings_data)

    setting_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        setting_service.add_capture_settings(
            project_name, settings_req)


def test_add_capture_settings_plugin_not_found(setting_service):
    project_name = "TestProject"
    settings_data = {"name": "TestSetting",
                     "plugin_id": "pub.non_existent_plugin", "settings": {}}
    settings_req = SettingsPostReq(**settings_data)

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.plugin_from_type_exists.return_value = False

    with pytest.raises(NotFoundException):
        setting_service.add_capture_settings(
            project_name, settings_req)


def test_add_capture_settings_already_exists(setting_service):
    project_name = "TestProject"
    settings_data = {"name": "ExistingSetting",
                     "plugin_id": "pub.plugin", "settings": {}}
    settings_req = SettingsPostReq(**settings_data)

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.plugin_from_type_exists.return_value = True

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = True
        mock_json_storage_class.return_value = mock_storage_instance

        with pytest.raises(AlreadyExistsException):
            setting_service.add_capture_settings(
                project_name, settings_req)


def test_add_capture_settings_invalid_settings_validation(setting_service):
    project_name = "TestProject"
    settings_req = SettingsPostReq(
        name="TestSetting", plugin_id="pub.plugin", settings={"invalid": "data"})

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.plugin_from_type_exists.return_value = True
    setting_service.plugin_management.validate_plugin_properties.side_effect = Exception(
        "Invalid property")

    with pytest.raises(BadRequestException):
        setting_service.add_capture_settings(
            project_name, settings_req)


def test_add_capture_settings_plugin_metadata_not_found(setting_service):
    project_name = "TestProject"
    settings_req = SettingsPostReq(
        name="TestSetting", plugin_id="pub.plugin", settings={})

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.plugin_from_type_exists.return_value = True
    setting_service.plugin_management.get_plugin_metadata.return_value = None

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.exists.return_value = False
        mock_json_storage_class.return_value = mock_storage_instance
        with pytest.raises(NotFoundException):
            setting_service.add_capture_settings(
                project_name, settings_req)


def test_get_all_capture_settings_success(setting_service, mock_plugin_metadata):
    project_name = "TestProject"
    settings_list = [
        {"name": "Setting1", "plugin_id": "pub.plugin1", "settings": {}},
        {"name": "Setting2", "plugin_id": "pub.plugin2", "settings": {}}
    ]

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.get_plugin_metadata.return_value = mock_plugin_metadata

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_all.return_value = settings_list
        mock_json_storage_class.return_value = mock_storage_instance

        result = setting_service.get_all_capture_settings(project_name)

        assert len(result) == 2
        assert result[0].name == "Setting1"
        assert result[1].plugin_id == "pub.plugin2"
        mock_storage_instance.find_all.assert_called_once()


def test_get_all_capture_settings_project_not_found(setting_service):
    project_name = "NonExistentProject"
    setting_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        setting_service.get_all_capture_settings(project_name)


def test_get_capture_settings_success(setting_service, mock_plugin_metadata):
    project_name = "TestProject"
    setting_name = "MySetting"
    setting_dict = {"name": setting_name,
                    "plugin_id": "pub.plugin1", "settings": {"key": "val"}}

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.get_plugin_metadata.return_value = mock_plugin_metadata

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_one.return_value = setting_dict
        mock_json_storage_class.return_value = mock_storage_instance

        result = setting_service.get_capture_settings(
            project_name, setting_name)

        assert result.name == setting_name
        assert result.plugin_id == "pub.plugin1"
        mock_storage_instance.find_one.assert_called_with(
            {"name": setting_name})


def test_get_capture_settings_not_found(setting_service):
    project_name = "TestProject"
    setting_name = "NonExistentSetting"
    setting_service.project_service.exists.return_value = True

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_one.return_value = None
        mock_json_storage_class.return_value = mock_storage_instance

        with pytest.raises(NotFoundException):
            setting_service.get_capture_settings(
                project_name, setting_name)


def test_get_capture_settings_project_not_found(setting_service):
    project_name = "NonExistentProject"
    setting_name = "AnySetting"
    setting_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        setting_service.get_capture_settings(
            project_name, setting_name)


def test_update_capture_settings_success(setting_service):
    project_name = "TestProject"
    setting_name = "MySetting"
    update_data = {"name": "UpdatedSetting",
                   "settings": {"new_key": "new_val"}}
    update_req = SettingsPutReq(**update_data)

    existing_setting = SettingsRes(
        name=setting_name, plugin_id="pub.plugin1", settings={"old_key": "old_val"})

    setting_service.get_capture_settings = MagicMock(
        return_value=existing_setting)
    setting_service.exists = MagicMock(return_value=False)

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_json_storage_class.return_value = mock_storage_instance

        result = setting_service.update_capture_settings(
            project_name, setting_name, update_req)

        assert result.name == "UpdatedSetting"
        assert result.settings == {"new_key": "new_val"}
        setting_service.get_capture_settings.assert_called_with(
            project_name, setting_name)
        mock_storage_instance.update.assert_called_with(
            {"name": setting_name}, ANY)


def test_update_capture_settings_invalid_settings_validation(setting_service):
    project_name = "TestProject"
    setting_name = "MySetting"
    update_req = SettingsPutReq(
        name=setting_name, settings={"invalid": "data"})

    existing_setting = SettingsRes(
        name=setting_name, plugin_id="pub.plugin1", settings={})
    setting_service.get_capture_settings = MagicMock(
        return_value=existing_setting)
    setting_service.plugin_management.validate_plugin_properties.side_effect = Exception(
        "Invalid property")

    with pytest.raises(BadRequestException):
        setting_service.update_capture_settings(
            project_name, setting_name, update_req)


def test_update_capture_settings_name_already_exists(setting_service):
    project_name = "TestProject"
    setting_name = "MySetting"
    update_req = SettingsPutReq(name="ExistingName", settings={})

    existing_setting = SettingsRes(
        name=setting_name, plugin_id="pub.plugin1", settings={})
    setting_service.get_capture_settings = MagicMock(
        return_value=existing_setting)
    setting_service.exists = MagicMock(return_value=True)

    with pytest.raises(AlreadyExistsException):
        setting_service.update_capture_settings(
            project_name, setting_name, update_req)


def test_delete_capture_settings_success(setting_service):
    project_name = "TestProject"
    setting_name = "ToDelete"

    setting_service.exists = MagicMock(return_value=True)

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_json_storage_class.return_value = mock_storage_instance

        setting_service.delete_capture_settings(
            project_name, setting_name)

        setting_service.exists.assert_called_with(
            project_name, setting_name)
        mock_storage_instance.delete_one.assert_called_with(
            {"name": setting_name})


def test_delete_capture_settings_not_found(setting_service):
    project_name = "TestProject"
    setting_name = "NonExistent"
    setting_service.exists = MagicMock(return_value=False)

    with pytest.raises(NotFoundException):
        setting_service.delete_capture_settings(
            project_name, setting_name)


def test_get_all_capture_settings_loaded_success(setting_service, mock_plugin_metadata):
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

    setting_service.project_service.exists.return_value = True
    setting_service.plugin_management.get_plugin_metadata.side_effect = [
        mock_plugin_metadata, unloaded_metadata]

    with patch('api.modules.capture.services.setting_service.JsonStorage') as mock_json_storage_class:
        mock_storage_instance = MagicMock()
        mock_storage_instance.find_all.return_value = settings_list
        mock_json_storage_class.return_value = mock_storage_instance

        result = setting_service.get_all_capture_settings_loaded(
            project_name)

        assert len(result) == 1
        assert result[0].name == "Loaded"
        assert result[0].plugin_id == mock_plugin_metadata.get_final_id()


def test_get_all_capture_settings_loaded_project_not_found(setting_service):
    project_name = "NonExistentProject"
    setting_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        setting_service.get_all_capture_settings_loaded(project_name)


def test_exists_project_not_found(setting_service):
    project_name = "NonExistentProject"
    setting_name = "AnySetting"
    setting_service.project_service.exists.return_value = False

    with pytest.raises(NotFoundException):
        setting_service.exists(project_name, setting_name)
