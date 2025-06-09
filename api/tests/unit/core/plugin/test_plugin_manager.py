from re import M
from mo.core.plugin.manager import PluginManager
from mo.core.plugin.models.settings import Settings
import pytest
from unittest.mock import MagicMock, patch, mock_open

from mo.core.plugin.models.plugin import Plugin, PluginMetadata
from mo.core.plugin.worker_process import PluginProcessMetadata, PluginWorkerProcess


@pytest.fixture
def plugin_manager():
    with patch.object(PluginManager, '__init__', return_value=None):
        manager = PluginManager()
        manager.plugins_dir = "plugins"
        manager.plugins_path = "/fake/path/plugins"
        manager.plugin_metadata_name = "metadata.json"
        manager.metadata_entry_points_name = "entryPoints"
        manager.plugins_metadata = {}
        manager.plugin_processes_metadata = {}
        manager.plugin_processes = {}
        manager.plugin_types = {}
        manager.plugin_types_to_check = []
    return manager


@pytest.fixture(autouse=True)
def clean_plugin_manager_singleton():
    PluginManager.clear_instance()  # type: ignore
    yield
    PluginManager.clear_instance()  # type: ignore


@patch('os.listdir')
def test_load_all_plugins_success(mock_listdir, plugin_manager):
    mock_listdir.return_value = ['plugin_a', 'plugin_b']
    with patch.object(plugin_manager, 'register_plugin') as mock_register:
        loaded_dirs = plugin_manager.load_all_plugins()

    assert len(loaded_dirs) == 2
    assert mock_register.call_count == 2
    mock_register.assert_any_call('plugin_a')
    mock_register.assert_any_call('plugin_b')


@patch('os.path.exists', return_value=True)
def test_load_metadata_file_success(mock_exists, plugin_manager):
    json_data = '{"name": "Test Plugin"}'
    with patch('builtins.open', mock_open(read_data=json_data)) as mocked_file:
        data = plugin_manager.load_metadata_file('plugin_a')

    assert data['name'] == "Test Plugin"
    mocked_file.assert_called_once()


@patch('os.path.exists', return_value=False)
def test_load_metadata_file_not_found(mock_exists, plugin_manager):
    with pytest.raises(FileNotFoundError):
        plugin_manager.load_metadata_file('non_existent_plugin')


@patch('mo.core.plugin.manager.multiprocessing.Queue')
@patch('mo.core.plugin.manager.PluginWorkerProcess')
@patch('mo.core.plugin.manager.load_plugin_metadata')
def test_register_plugin_success(mock_load_meta, mock_process, mock_queue, plugin_manager):
    mock_meta = MagicMock(spec=PluginMetadata)
    mock_meta.platform = MagicMock()
    mock_meta.platform.is_available = MagicMock(return_value=True)
    mock_load_meta.return_value = mock_meta
    plugin_manager.get_entry_points = MagicMock(return_value={})

    mock_status_queue = MagicMock()
    mock_status_queue.get.return_value = {
        "is_loaded": True,
        "plugin_types": [Plugin]
    }
    mock_queue.return_value = mock_status_queue

    result = plugin_manager.register_plugin('plugin_a')

    assert result._is_loaded is True
    assert 'plugin_a' in plugin_manager.plugins_metadata
    mock_process.assert_called_once()
    mock_process.return_value.start.assert_called_once()


def test_remove_plugin_by_dir_success(plugin_manager):
    mock_process = MagicMock(spec=PluginWorkerProcess)
    mock_process.is_alive.return_value = True

    plugin_manager.plugins_metadata['plugin_a'] = MagicMock()
    plugin_manager.plugin_processes['plugin_a'] = mock_process

    plugin_manager.remove_plugin_by_dir('plugin_a')

    assert 'plugin_a' not in plugin_manager.plugins_metadata
    assert 'plugin_a' not in plugin_manager.plugin_processes
    mock_process.terminate.assert_called_once()


def test_remove_plugin_by_dir_not_found(plugin_manager):
    with pytest.raises(ValueError):
        plugin_manager.remove_plugin_by_dir('non_existent_plugin')


def test_get_plugin_metadata_success(plugin_manager):
    mock_meta = MagicMock(spec=PluginMetadata)
    mock_meta.is_plugin_from_final_id.return_value = True
    plugin_manager.plugins_metadata['plugin_a'] = mock_meta

    result = plugin_manager.get_plugin_metadata("some.plugin.id")

    assert result is mock_meta


def test_get_plugin_metadata_not_found(plugin_manager):
    result = plugin_manager.get_plugin_metadata("non.existent.id")
    assert result is None


@patch('mo.core.plugin.manager.PluginWorkerProcess')
def test_get_active_plugin_process_creates_new(mock_process_class, plugin_manager):
    mock_meta = MagicMock(spec=PluginMetadata)
    mock_meta.is_plugin_from_final_id.return_value = True
    mock_process_meta = MagicMock(spec=PluginProcessMetadata)
    mock_process_meta.metadata = mock_meta
    mock_process_meta.dir_name = 'plugin_a'
    mock_process_meta.status_queue = MagicMock()
    mock_process_meta.status_queue.get.return_value = True

    plugin_manager.plugin_processes_metadata['plugin_a'] = mock_process_meta
    plugin_manager.plugins_metadata['plugin_a'] = mock_meta

    result = plugin_manager.get_active_plugin_process("some.plugin.id")

    assert result is not None
    mock_process_class.assert_called_once()
    mock_process_class.return_value.start.assert_called_once()


def test_get_plugins_metadata_from_type_success(plugin_manager):
    mock_meta_a = MagicMock()
    mock_meta_b = MagicMock()
    plugin_manager.plugins_metadata = {
        'plugin_a': mock_meta_a, 'plugin_b': mock_meta_b}

    class TargetType:
        pass
    plugin_manager.plugin_types = {'plugin_a': [TargetType]}

    result = plugin_manager.get_plugins_metadata_from_type(TargetType)

    assert len(result) == 1
    assert result[0] is mock_meta_a


def test_validate_plugin_settings_success(plugin_manager):
    mock_meta = MagicMock(spec=PluginMetadata)
    mock_meta.is_plugin_from_final_id.return_value = True
    mock_process_meta = MagicMock(spec=PluginProcessMetadata)
    mock_process_meta.metadata = mock_meta
    mock_process = MagicMock(spec=PluginWorkerProcess)
    mock_process.is_alive.return_value = True

    plugin_manager.plugins_metadata['plugin_a'] = mock_meta
    plugin_manager.plugin_processes_metadata['plugin_a'] = mock_process_meta
    plugin_manager.plugin_processes['plugin_a'] = mock_process

    mock_settings = MagicMock()
    plugin_manager.validate_plugin_settings("some.plugin.id", mock_settings)

    mock_process.validate_settings.assert_called_with(mock_settings)


@patch('os.listdir')
@patch('builtins.print')
def test_load_all_plugins_handles_exception(mock_print, mock_listdir, plugin_manager):
    mock_listdir.return_value = ['plugin_a']
    with patch.object(plugin_manager, 'register_plugin', side_effect=Exception("Failed to load")):
        loaded_dirs = plugin_manager.load_all_plugins()

    assert not loaded_dirs
    mock_print.assert_called()


def test_get_entry_point(plugin_manager):
    metadata_dict = {
        "entryPoints": {
            "mo.plugin": "my_module:MyClass"
        }
    }
    with patch.object(plugin_manager, 'load_metadata_file', return_value=metadata_dict):
        result = plugin_manager.get_entry_point('plugin_a', 'mo.plugin')
        assert result[0].endswith("my_module.py")
        assert result[1] == "MyClass"

        none_result = plugin_manager.get_entry_point(
            'plugin_a', 'non.existent')
        assert none_result is None


def test_exists_entry_point(plugin_manager):
    metadata_dict = {"entryPoints": {"mo.plugin": "a:b"}}
    with patch.object(plugin_manager, 'load_metadata_file', return_value=metadata_dict):
        assert plugin_manager.exists_entry_point(
            'plugin_a', 'mo.plugin') is True
        assert plugin_manager.exists_entry_point(
            'plugin_a', 'non.existent') is False


@patch('mo.core.plugin.manager.load_plugin_metadata')
def test_register_plugin_already_exists(mock_load_meta, plugin_manager):
    with patch.object(plugin_manager, 'plugin_metadata_exists', return_value=True):
        with pytest.raises(ImportError):
            plugin_manager.register_plugin('plugin_a')


@patch('mo.core.plugin.manager.load_plugin_metadata')
def test_register_plugin_platform_not_available(mock_load_meta, plugin_manager):
    mock_meta = MagicMock(spec=PluginMetadata)
    mock_meta.platform = MagicMock()
    mock_meta.platform.is_available.return_value = False
    mock_load_meta.return_value = mock_meta

    with patch.object(plugin_manager, 'plugin_metadata_exists', return_value=False):
        result = plugin_manager.register_plugin('plugin_a')

    assert result._is_loaded is False
    assert result._error is not None


def test_remove_plugin_success(plugin_manager):
    with patch.object(plugin_manager, '_get_plugin_metadata_dir', return_value='plugin_a') as mock_get_dir:
        with patch.object(plugin_manager, 'remove_plugin_by_dir') as mock_remove:
            plugin_manager.remove_plugin('some.id')

    mock_get_dir.assert_called_with('some.id')
    mock_remove.assert_called_with('plugin_a')


@patch('mo.core.plugin.manager.load_plugin_metadata')
def test_rename_plugin_dir_success(mock_load_meta, plugin_manager):
    with patch.object(plugin_manager, 'remove_plugin') as mock_remove:
        with patch.object(plugin_manager, 'register_plugin') as mock_register:
            plugin_manager.rename_plugin_dir('new_name')

    mock_remove.assert_called_once()
    mock_register.assert_called_once_with('new_name')


def test_get_all_plugins_metadata(plugin_manager):
    plugin_manager.plugins_metadata = {'a': 1, 'b': 2}
    result = plugin_manager.get_all_plugins_metadata()
    assert len(result) == 2
    assert 1 in result and 2 in result


def test_get_plugin_dir_name(plugin_manager):
    mock_meta = MagicMock(spec=PluginMetadata)
    mock_meta.is_plugin_from_final_id.return_value = True
    plugin_manager.plugins_metadata = {'plugin_a': mock_meta}

    assert plugin_manager.get_plugin_dir_name('id') == 'plugin_a'
    with pytest.raises(ValueError):
        mock_meta.is_plugin_from_final_id.return_value = False
        plugin_manager.get_plugin_dir_name('id')


def test_get_plugin_process_success(plugin_manager):
    mock_process = MagicMock()
    plugin_manager.plugin_processes = {'plugin_a': mock_process}
    with patch.object(plugin_manager, '_get_plugin_process_metadata_dir', return_value='plugin_a'):
        result = plugin_manager.get_plugin_process('id')

    assert result is mock_process


def test_get_active_plugin_process_key_is_none(plugin_manager):
    with patch.object(plugin_manager, '_get_plugin_process_metadata_dir', return_value=None):
        result = plugin_manager.get_active_plugin_process('id')
    assert result is None


def test_get_active_plugin_process_returns_existing(plugin_manager):
    mock_process = MagicMock(spec=PluginWorkerProcess)
    mock_process.is_alive.return_value = True
    plugin_manager.plugin_processes = {'plugin_a': mock_process}
    with patch.object(plugin_manager, '_get_plugin_process_metadata_dir', return_value='plugin_a'):
        result = plugin_manager.get_active_plugin_process('id')

    assert result is mock_process
    mock_process.set_timeout.assert_called_with(None)


def test_get_active_plugin_process_metadata_is_none(plugin_manager):
    plugin_manager.plugin_processes_metadata = MagicMock()
    plugin_manager.plugin_processes_metadata.get.return_value = None
    plugin_manager._get_plugin_process_metadata_dir = MagicMock(
        return_value='plugin_a')
    result = plugin_manager.get_active_plugin_process('id')
    assert result is None


@patch('mo.core.plugin.manager.PluginWorkerProcess')
def test_get_plugin_properties_success(plugin_worker_process, plugin_manager):
    mock_process = MagicMock(spec=PluginWorkerProcess)
    mock_process.get_properties.return_value = [{"prop": "value"}]
    mock_process.is_alive.return_value = False
    plugin_manager.plugin_processes = {'plugin_a': mock_process}
    plugin_manager._get_plugin_metadata_dir = MagicMock(
        return_value='plugin_a')
    plugin_manager.plugin_processes_metadata = MagicMock()
    process_metadata = MagicMock(spec=PluginProcessMetadata)
    process_metadata.status_queue = MagicMock()
    process_metadata.status_queue.get.return_value = {}
    plugin_manager.plugin_processes_metadata.get.return_value = process_metadata
    plugin_worker_process.return_value = mock_process
    plugin_worker_process.start = MagicMock()

    result = plugin_manager.get_plugin_properties('plugin_a', None)

    assert result == [{"prop": "value"}]
    mock_process.get_properties.assert_called_with(None)


def test_validate_plugin_settings_key_is_none(plugin_manager):
    with patch.object(plugin_manager, '_get_plugin_metadata_dir', return_value=None):
        with pytest.raises(ValueError):
            plugin_manager.validate_plugin_settings('id', MagicMock())


def test_validate_plugin_settings_metadata_is_none(plugin_manager):
    plugin_manager._get_plugin_metadata_dir = MagicMock(
        return_value='plugin_a')
    plugin_manager.plugin_processes_metadata = MagicMock()
    plugin_manager.plugin_processes_metadata.get.return_value = None

    with pytest.raises(ValueError):
        plugin_manager.validate_plugin_settings('id', MagicMock())


@patch('mo.core.plugin.manager.PluginWorkerProcess')
def test_validate_plugin_settings_process_is_none(mock_worker_class, plugin_manager):
    mock_settings = MagicMock(spec=Settings)

    with patch.object(plugin_manager, '_get_plugin_metadata_dir', return_value='plugin_a'):
        plugin_manager.plugin_processes_metadata['plugin_a'] = MagicMock()
        plugin_manager.plugin_processes.clear()

        plugin_manager.validate_plugin_settings('id', mock_settings)

    mock_worker_class.assert_called_once()
    mock_worker_class.return_value.validate_settings.assert_called_with(
        mock_settings)


def test_plugin_from_type_exists(plugin_manager):
    mock_meta = MagicMock(spec=PluginMetadata)
    mock_meta.is_plugin_from_final_id.return_value = True

    with patch.object(plugin_manager, 'get_plugins_metadata_from_type', return_value=[mock_meta]):
        assert plugin_manager.plugin_from_type_exists('id', int) is True

        mock_meta.is_plugin_from_final_id.return_value = False
        assert plugin_manager.plugin_from_type_exists('id', int) is False


def test_remove_plugin_dir_name_is_none(plugin_manager):
    plugin_manager._get_plugin_metadata_dir = MagicMock(return_value=None)

    with pytest.raises(ValueError, match="not found in registered plugins"):
        plugin_manager.remove_plugin('non_existent.id')

    plugin_manager._get_plugin_metadata_dir.assert_called_with(
        'non_existent.id')


def test_get_plugin_process_key_is_none(plugin_manager):
    plugin_manager._get_plugin_process_metadata_dir = MagicMock(
        return_value=None)

    result = plugin_manager.get_plugin_process('non_existent.id')

    assert result is None
    plugin_manager._get_plugin_process_metadata_dir.assert_called_with(
        'non_existent.id')


def test_get_plugin_properties_key_is_none(plugin_manager):
    plugin_manager._get_plugin_metadata_dir = MagicMock(return_value=None)

    result = plugin_manager.get_plugin_properties('non_existent.id', None)

    assert result is None
    plugin_manager._get_plugin_metadata_dir.assert_called_with(
        'non_existent.id')


def test_get_plugin_properties_metadata_is_none(plugin_manager):
    plugin_manager._get_plugin_metadata_dir = MagicMock(
        return_value='plugin_a')
    plugin_manager.plugin_processes_metadata = {}

    result = plugin_manager.get_plugin_properties('some.id', None)

    assert result is None
    plugin_manager._get_plugin_metadata_dir.assert_called_with('some.id')
