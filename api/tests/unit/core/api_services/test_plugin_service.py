import pytest
from unittest.mock import MagicMock, patch, AsyncMock

from mo.core.utils.i18n import initialize_i18n
from mo.core.api.services.plugin_service import PluginService
from mo.core.plugin.models.plugin import PluginMetadata
from mo.core.utils.http_exceptions import BadRequestException


@pytest.fixture
def plugin_service():
    initialize_i18n()
    service = PluginService()
    service.plugin_manager = MagicMock()
    service.plugins_dir_handler = MagicMock()
    service.file_management = MagicMock()
    # Set AsyncMock for all async methods used
    service.file_management.copy_file_obj_async = AsyncMock()
    service.file_management.extract_zip_async = AsyncMock()
    service.file_management.delete_file_async = AsyncMock()
    service.file_management.delete_directory_async = AsyncMock()
    return service


@pytest.mark.asyncio
async def test_add_plugin_success(plugin_service):
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.zip"
    mock_file.file = MagicMock()
    plugin_service.file_management.get_unique_name.return_value = "my_plugin_abc"
    plugin_service.file_management.create_directory.return_value = "/path/my_plugin_abc"
    plugin_service.file_management.copy_file_obj_async.return_value = "/path/my_plugin_abc/my_plugin.zip"
    plugin_service.file_management.extract_zip_async.return_value = None
    plugin_service.file_management.delete_file_async.return_value = None

    mock_metadata = MagicMock(spec=PluginMetadata)
    plugin_service.plugin_manager.register_plugin.return_value = mock_metadata

    with patch("mo.core.api.services.plugin_service.PluginRes") as mock_plugin_res, \
            patch("mo.core.api.services.plugin_service.translate", return_value="File must be a zip archive"):
        result = await plugin_service.add_plugin(mock_file)

    plugin_service.plugins_dir_handler.suspend.assert_called_once()
    plugin_service.file_management.extract_zip_async.assert_called_once()
    plugin_service.file_management.delete_file_async.assert_called_once()
    plugin_service.plugin_manager.register_plugin.assert_called_with(
        "my_plugin_abc")
    plugin_service.plugins_dir_handler.add_known_dir.assert_called_with(
        "my_plugin_abc")
    plugin_service.plugins_dir_handler.resume.assert_called()
    mock_plugin_res.from_plugin_metadata.assert_called_with(mock_metadata)


@pytest.mark.asyncio
async def test_add_plugin_invalid_file_type(plugin_service):
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.txt"
    with patch("mo.core.api.services.plugin_service.translate", return_value="File must be a zip archive"):
        with pytest.raises(BadRequestException, match="File must be a zip archive"):
            await plugin_service.add_plugin(mock_file)


@pytest.mark.asyncio
async def test_add_plugin_register_fails(plugin_service):
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.zip"
    plugin_service.file_management.get_unique_name.return_value = "my_plugin_abc"
    plugin_service.file_management.create_directory.return_value = "/path/my_plugin_abc"
    plugin_service.file_management.copy_file_obj_async.return_value = "/path/my_plugin_abc/my_plugin.zip"
    plugin_service.file_management.extract_zip_async.return_value = None
    plugin_service.file_management.delete_file_async.return_value = None
    plugin_service.plugin_manager.register_plugin.side_effect = Exception(
        "Registration failed")

    with patch("mo.core.api.services.plugin_service.translate", return_value="Failed to add plugin"):
        with pytest.raises(BadRequestException, match="Failed to add plugin"):
            await plugin_service.add_plugin(mock_file)

    plugin_service.file_management.delete_directory_async.assert_called_with(
        "my_plugin_abc")


@pytest.mark.asyncio
async def test_update_plugin_success(plugin_service):
    final_id = "publisher.plugin"
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.zip"
    mock_file.file = MagicMock()

    plugin_service.plugin_manager.plugin_metadata_exists.return_value = True
    plugin_service.file_management.get_unique_name.return_value = "my_plugin_new"
    plugin_service.file_management.create_directory.return_value = "/path/my_plugin_new"
    plugin_service.file_management.copy_file_obj_async.return_value = "/path/my_plugin_new/my_plugin.zip"
    plugin_service.plugin_manager._get_plugin_metadata_path.return_value = "/path/my_plugin_new/metadata.json"
    plugin_service.plugin_manager.get_plugin_dir_name.return_value = "my_plugin_old"

    new_metadata = MagicMock(spec=PluginMetadata)
    new_metadata.get_final_id.return_value = final_id
    updated_metadata = MagicMock(spec=PluginMetadata)
    plugin_service.plugin_manager.register_plugin.return_value = updated_metadata

    with patch("mo.core.api.services.plugin_service.load_plugin_metadata", return_value=new_metadata), \
            patch("mo.core.api.services.plugin_service.PluginRes") as mock_plugin_res:
        await plugin_service.update_plugin(final_id, mock_file)

    # New release staged and swapped in atomically
    plugin_service.plugins_dir_handler.suspend.assert_called_once()
    plugin_service.file_management.extract_zip_async.assert_awaited_once()
    plugin_service.file_management.delete_file_async.assert_awaited_once()
    plugin_service.plugin_manager.remove_plugin.assert_called_once_with(final_id)
    plugin_service.plugin_manager.register_plugin.assert_called_once_with("my_plugin_new")
    # Old directory only removed after the new one registered successfully
    plugin_service.file_management.delete_directory_async.assert_called_once_with("my_plugin_old")
    plugin_service.plugins_dir_handler.remove_known_dir.assert_called_once_with("my_plugin_old")
    plugin_service.plugins_dir_handler.add_known_dir.assert_called_once_with("my_plugin_new")
    plugin_service.plugins_dir_handler.resume.assert_called_once()
    mock_plugin_res.from_plugin_metadata.assert_called_once_with(updated_metadata)


@pytest.mark.asyncio
async def test_update_plugin_not_found(plugin_service):
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.zip"
    plugin_service.plugin_manager.plugin_metadata_exists.return_value = False

    with patch("mo.core.api.services.plugin_service.translate", return_value="not found"):
        with pytest.raises(BadRequestException, match="not found"):
            await plugin_service.update_plugin("non.existent.id", mock_file)

    plugin_service.plugins_dir_handler.suspend.assert_not_called()
    plugin_service.plugin_manager.remove_plugin.assert_not_called()
    plugin_service.file_management.delete_directory_async.assert_not_called()


@pytest.mark.asyncio
async def test_update_plugin_invalid_file_type(plugin_service):
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.txt"
    plugin_service.plugin_manager.plugin_metadata_exists.return_value = True

    with patch("mo.core.api.services.plugin_service.translate", return_value="File must be a zip archive"):
        with pytest.raises(BadRequestException, match="File must be a zip archive"):
            await plugin_service.update_plugin("publisher.plugin", mock_file)

    # Fails before touching the installed plugin or suspending the watcher
    plugin_service.plugins_dir_handler.suspend.assert_not_called()
    plugin_service.plugin_manager.remove_plugin.assert_not_called()


@pytest.mark.asyncio
async def test_update_plugin_id_mismatch(plugin_service):
    final_id = "publisher.plugin"
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.zip"
    mock_file.file = MagicMock()

    plugin_service.plugin_manager.plugin_metadata_exists.return_value = True
    plugin_service.file_management.get_unique_name.return_value = "my_plugin_new"
    plugin_service.file_management.create_directory.return_value = "/path/my_plugin_new"
    plugin_service.file_management.copy_file_obj_async.return_value = "/path/my_plugin_new/my_plugin.zip"
    plugin_service.plugin_manager._get_plugin_metadata_path.return_value = "/path/my_plugin_new/metadata.json"

    new_metadata = MagicMock(spec=PluginMetadata)
    new_metadata.get_final_id.return_value = "other.plugin"

    with patch("mo.core.api.services.plugin_service.load_plugin_metadata", return_value=new_metadata), \
            patch("mo.core.api.services.plugin_service.translate", return_value="Failed to update plugin"):
        with pytest.raises(BadRequestException, match="Failed to update plugin"):
            await plugin_service.update_plugin(final_id, mock_file)

    # Staging directory discarded; the installed plugin is never removed
    plugin_service.file_management.delete_directory_async.assert_called_once_with("my_plugin_new")
    plugin_service.plugin_manager.remove_plugin.assert_not_called()
    plugin_service.plugins_dir_handler.resume.assert_called_once()


@pytest.mark.asyncio
async def test_update_plugin_register_fails_rolls_back(plugin_service):
    final_id = "publisher.plugin"
    mock_file = MagicMock()
    mock_file.filename = "my_plugin.zip"
    mock_file.file = MagicMock()

    plugin_service.plugin_manager.plugin_metadata_exists.return_value = True
    plugin_service.file_management.get_unique_name.return_value = "my_plugin_new"
    plugin_service.file_management.create_directory.return_value = "/path/my_plugin_new"
    plugin_service.file_management.copy_file_obj_async.return_value = "/path/my_plugin_new/my_plugin.zip"
    plugin_service.plugin_manager._get_plugin_metadata_path.return_value = "/path/my_plugin_new/metadata.json"
    plugin_service.plugin_manager.get_plugin_dir_name.return_value = "my_plugin_old"

    new_metadata = MagicMock(spec=PluginMetadata)
    new_metadata.get_final_id.return_value = final_id
    # First call (new release) fails; second call (rollback of old plugin) succeeds
    plugin_service.plugin_manager.register_plugin.side_effect = [
        Exception("Registration failed"),
        MagicMock(spec=PluginMetadata),
    ]

    with patch("mo.core.api.services.plugin_service.load_plugin_metadata", return_value=new_metadata), \
            patch("mo.core.api.services.plugin_service.translate", return_value="Failed to update plugin"):
        with pytest.raises(BadRequestException, match="Failed to update plugin"):
            await plugin_service.update_plugin(final_id, mock_file)

    # Old plugin re-registered from its untouched directory, staging discarded
    plugin_service.plugin_manager.remove_plugin.assert_called_once_with(final_id)
    plugin_service.plugin_manager.register_plugin.assert_any_call("my_plugin_old")
    plugin_service.file_management.delete_directory_async.assert_called_once_with("my_plugin_new")
    plugin_service.plugins_dir_handler.resume.assert_called_once()


@pytest.mark.asyncio
async def test_get_all_plugins(plugin_service):
    mock_plugins_list = [
        MagicMock(spec=PluginMetadata), MagicMock(spec=PluginMetadata)]
    plugin_service.plugin_manager.get_all_plugins_metadata.return_value = mock_plugins_list

    with patch("mo.core.api.services.plugin_service.PluginRes") as mock_plugin_res:
        result = await plugin_service.get_all_plugins()

    assert len(result) == 2
    assert mock_plugin_res.from_plugin_metadata.call_count == 2


def test_get_plugin_success(plugin_service):
    mock_metadata = MagicMock(spec=PluginMetadata)
    plugin_service.plugin_manager.get_plugin_metadata.return_value = mock_metadata

    with patch("mo.core.api.services.plugin_service.PluginRes") as mock_plugin_res:
        result = plugin_service.get_plugin("some.id")

    assert result == mock_plugin_res.from_plugin_metadata(mock_metadata)
    plugin_service.plugin_manager.get_plugin_metadata.assert_called_with(
        "some.id")


def test_get_plugin_not_found(plugin_service):
    plugin_service.plugin_manager.get_plugin_metadata.return_value = None
    with patch("mo.core.api.services.plugin_service.translate", return_value="not found"):
        with pytest.raises(BadRequestException, match="not found"):
            plugin_service.get_plugin("non.existent.id")


@pytest.mark.asyncio
async def test_remove_plugin_success(plugin_service):
    plugin_service.plugin_manager.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_manager.get_plugin_dir_name.return_value = "dir_to_delete"
    plugin_service.plugin_manager.remove_plugin.return_value = "dir_to_delete"

    await plugin_service.remove_plugin("plugin.to.remove")

    plugin_service.plugins_dir_handler.suspend.assert_called_once()
    plugin_service.plugin_manager.remove_plugin.assert_called_with(
        "plugin.to.remove")
    plugin_service.file_management.delete_directory_async.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.remove_known_dir.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.resume.assert_called()


@pytest.mark.asyncio
async def test_remove_plugin_not_found(plugin_service):
    plugin_service.plugin_manager.get_plugin_metadata.return_value = None
    with patch("mo.core.api.services.plugin_service.translate", return_value="not found"):
        with pytest.raises(BadRequestException, match="not found"):
            await plugin_service.remove_plugin("non.existent.plugin")

    plugin_service.plugins_dir_handler.suspend.assert_not_called()
    plugin_service.plugin_manager.remove_plugin.assert_not_called()
    plugin_service.file_management.delete_directory_async.assert_not_called()
    plugin_service.plugins_dir_handler.remove_known_dir.assert_not_called()
    plugin_service.plugins_dir_handler.resume.assert_not_called()


@pytest.mark.asyncio
async def test_remove_plugin_handles_cleanup_exception(plugin_service):
    plugin_service.plugin_manager.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_manager.get_plugin_dir_name.return_value = "dir_to_delete"
    plugin_service.plugin_manager.remove_plugin.side_effect = Exception(
        "Cleanup failed")

    with patch("mo.core.api.services.plugin_service.translate", return_value="Failed to remove plugin"):
        with pytest.raises(BadRequestException, match="Failed to remove plugin"):
            await plugin_service.remove_plugin("plugin.to.remove")

    plugin_service.plugin_manager.register_plugin.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.add_known_dir.assert_called_with(
        "dir_to_delete")
    plugin_service.plugins_dir_handler.resume.assert_called()


def test_get_plugin_properties_success(plugin_service):
    plugin_service.plugin_manager.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_manager.get_plugin_properties.return_value = [
        {"name": "prop1", "label": "Label 1", "type": "str", "required": False}
    ]

    with patch("mo.core.api.services.plugin_service.PropertyRes") as mock_prop_res:
        result = plugin_service.get_plugin_properties("some.id")

    assert len(result) == 1
    mock_prop_res.assert_called_once()


def test_get_plugin_properties_not_found(plugin_service):
    plugin_service.plugin_manager.get_plugin_metadata.return_value = None
    with patch("mo.core.api.services.plugin_service.translate", return_value="not found"):
        with pytest.raises(BadRequestException, match="not found"):
            plugin_service.get_plugin_properties("non.existent.id")

    plugin_service.plugin_manager.get_plugin_metadata.assert_called_with(
        "non.existent.id")


def test_get_plugin_properties_returns_empty_list(plugin_service):
    plugin_service.plugin_manager.get_plugin_metadata.return_value = MagicMock()
    plugin_service.plugin_manager.get_plugin_properties.return_value = None

    result = plugin_service.get_plugin_properties("some.id")

    assert result == []
