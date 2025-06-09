import pytest
from unittest.mock import MagicMock, patch

from api.core.api.services.plugin_service import PluginService
from api.core.plugin.plugin import PluginMetadata
from api.core.utils.http_exceptions import BadRequestException


@pytest.fixture
def plugin_service():
    service = PluginService()
    service.plugin_management = MagicMock()
    service.plugins_dir_handler = MagicMock()
    service.file_management = MagicMock()
    return service


def test_add_plugin_success(plugin_service):
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.zip"
    mock_file.file = MagicMock()

    plugin_service.file_management.get_unique_name.return_value = "my_plugin_abc"
    plugin_service.file_management.create_directory.return_value = "/path/my_plugin_abc"
    plugin_service.file_management.copy_file_obj.return_value = "/path/my_plugin_abc/my_plugin.zip"

    mock_metadata = MagicMock(spec=PluginMetadata)
    plugin_service.plugin_management.register_plugin.return_value = mock_metadata

    with patch('api.core.api.services.plugin_service.PluginRes') as mock_plugin_res:
        result = plugin_service.add_plugin(mock_file)

    plugin_service.plugins_dir_handler.suspend.assert_called_once()
    plugin_service.file_management.extract_zip.assert_called_once()
    plugin_service.file_management.delete_file.assert_called_once()
    plugin_service.plugin_management.register_plugin.assert_called_with(
        "my_plugin_abc")
    plugin_service.plugins_dir_handler.add_known_dir.assert_called_with(
        "my_plugin_abc")
    plugin_service.plugins_dir_handler.resume.assert_called_once()
    mock_plugin_res.from_plugin_metadata.assert_called_with(mock_metadata)


def test_add_plugin_invalid_file_type(plugin_service):
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.txt"
    with pytest.raises(BadRequestException, match="File must be a zip archive"):
        plugin_service.add_plugin(mock_file)


def test_add_plugin_register_fails(plugin_service):
    mock_file = MagicMock(filename="my_plugin.zip")
    plugin_service.file_management.get_unique_name.return_value = "my_plugin_abc"
    plugin_service.plugin_management.register_plugin.side_effect = Exception(
        "Registration failed")

    with pytest.raises(BadRequestException, match="Failed to add plugin"):
        plugin_service.add_plugin(mock_file)

    plugin_service.file_management.delete_directory.assert_called_with(
        "my_plugin_abc")
    plugin_service.plugins_dir_handler.resume.assert_not_called()


def test_get_all_plugins(plugin_service):
    mock_plugins_list = [
        MagicMock(spec=PluginMetadata), MagicMock(spec=PluginMetadata)]
    plugin_service.plugin_management.get_all_plugins_metadata.return_value = mock_plugins_list

    with patch('api.core.api.services.plugin_service.PluginRes') as mock_plugin_res:
        result = plugin_service.get_all_plugins()

    assert len(result) == 2
    assert mock_plugin_res.from_plugin_metadata.call_count == 2


def test_get_plugin_success(plugin_service):
    mock_metadata = MagicMock(spec=PluginMetadata)
    plugin_service.plugin_management.get_plugin_metadata.return_value = mock_metadata

    with patch('api.core.api.services.plugin_service.PluginRes') as mock_plugin_res:
        result = plugin_service.get_plugin("some.id")

    assert result == mock_plugin_res.from_plugin_metadata(mock_metadata)
    plugin_service.plugin_management.get_plugin_metadata.assert_called_with("some.id")


def test_get_plugin_not_found(plugin_service):
    plugin_service.plugin_management.get_plugin_metadata.return_value = None
    with pytest.raises(BadRequestException, match="not found"):
        plugin_service.get_plugin("non.existent.id")


def test_remove_plugin_success(plugin_service):
    plugin_service.plugin_management.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_management.get_plugin_dir_name.return_value = "dir_to_delete"

    plugin_service.plugin_management.remove_plugin.return_value = "dir_to_delete"

    plugin_service.remove_plugin("plugin.to.remove")

    plugin_service.plugins_dir_handler.suspend.assert_called_once()
    plugin_service.plugin_management.remove_plugin.assert_called_with(
        "plugin.to.remove")
    plugin_service.file_management.delete_directory.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.remove_known_dir.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.resume.assert_called_once()


def test_remove_plugin_not_found(plugin_service):
    plugin_service.plugin_management.get_plugin_metadata.return_value = None

    with pytest.raises(BadRequestException, match="not found"):
        plugin_service.remove_plugin("non.existent.plugin")

    plugin_service.plugins_dir_handler.suspend.assert_not_called()
    plugin_service.plugin_management.remove_plugin.assert_not_called()
    plugin_service.file_management.delete_directory.assert_not_called()
    plugin_service.plugins_dir_handler.remove_known_dir.assert_not_called()
    plugin_service.plugins_dir_handler.resume.assert_not_called()


def test_remove_plugin_handles_cleanup_exception(plugin_service):
    plugin_service.plugin_management.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_management.get_plugin_dir_name.return_value = "dir_to_delete"
    plugin_service.plugin_management.remove_plugin.side_effect = Exception(
        "Cleanup failed")

    with pytest.raises(BadRequestException, match="Failed to remove plugin"):
        plugin_service.remove_plugin("plugin.to.remove")

    plugin_service.plugin_management.register_plugin.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.add_known_dir.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.resume.assert_called()


def test_get_plugin_properties_success(plugin_service):
    plugin_service.plugin_management.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_management.get_plugin_properties.return_value = [
        {"name": "prop1", "label": "Label 1", "type": "str", "required": False}
    ]

    with patch('api.core.api.services.plugin_service.PropertyRes') as mock_prop_res:
        result = plugin_service.get_plugin_properties("some.id")

    assert len(result) == 1
    mock_prop_res.assert_called_once()

def test_get_plugin_properties_not_found(plugin_service):
    plugin_service.plugin_management.get_plugin_metadata.return_value = None

    with pytest.raises(BadRequestException, match="not found"):
        plugin_service.get_plugin_properties("non.existent.id")

    plugin_service.plugin_management.get_plugin_metadata.assert_called_with("non.existent.id")

def test_get_plugin_properties_returns_empty_list(plugin_service):
    plugin_service.plugin_management.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_management.get_plugin_properties.return_value = None

    result = plugin_service.get_plugin_properties("some.id")

    assert result == []
