import logging
import logging.handlers
from unittest.mock import MagicMock, patch

from mo.core.config import constants
import pytest
from watchdog.events import DirCreatedEvent, DirDeletedEvent, DirMovedEvent

from mo.core.plugin.dir_observer import PluginsDirHandler
from mo.core.plugin.manager import PluginManager


@pytest.fixture
def plugins_dir_handler():
    mock_manager_instance = MagicMock(spec=PluginManager)
    mock_manager_instance.load_all_plugins.return_value = ["existing_plugin"]

    handler = PluginsDirHandler()
    handler.plugin_manager = mock_manager_instance
    yield handler


@pytest.fixture(autouse=True)
def clean_dir_handler_singleton():
    PluginsDirHandler.clear_instance()  # type: ignore
    yield
    PluginsDirHandler.clear_instance()  # type: ignore


@pytest.fixture(autouse=True)
def disable_file_logging():
    logger = logging.getLogger(constants.LOGGER_NAME)

    file_handlers = [h for h in logger.handlers if isinstance(
        h, logging.handlers.TimedRotatingFileHandler) or isinstance(h, logging.StreamHandler)]
    for handler in file_handlers:
        logger.removeHandler(handler)

    yield

    for handler in file_handlers:
        logger.addHandler(handler)


def test_suspend_and_resume(plugins_dir_handler):
    assert plugins_dir_handler.suspended is False
    plugins_dir_handler.suspend()
    assert plugins_dir_handler.suspended is True
    plugins_dir_handler.resume()
    assert plugins_dir_handler.suspended is False


def test_add_and_remove_known_dir(plugins_dir_handler):
    plugins_dir_handler.add_known_dir("new_dir")
    assert "new_dir" in plugins_dir_handler.known_dirs

    plugins_dir_handler.add_known_dir("new_dir")
    assert plugins_dir_handler.known_dirs.count("new_dir") == 1

    plugins_dir_handler.remove_known_dir("new_dir")
    assert "new_dir" not in plugins_dir_handler.known_dirs

    plugins_dir_handler.remove_known_dir("non_existent_dir")
    assert "non_existent_dir" not in plugins_dir_handler.known_dirs


@patch("os.path.exists", side_effect=[False, False, True])
@patch("time.sleep")
def test_wait_for_file_success(mock_sleep, mock_exists, plugins_dir_handler):
    result = plugins_dir_handler.wait_for_file("/fake/path")
    assert result is True
    assert mock_exists.call_count == 3
    assert mock_sleep.call_count == 2


@patch("os.path.exists", return_value=False)
@patch("time.time", side_effect=[100.0, 105.0, 110.0, 115.0, 121.0])
@patch("time.sleep")
def test_wait_for_file_timeout(mock_sleep, mock_time, mock_exists, plugins_dir_handler):
    result = plugins_dir_handler.wait_for_file("/fake/path", timeout=20.0)
    assert result is False


@patch("os.path.relpath", return_value="new_plugin")
def test_on_created_success(mock_relpath, plugins_dir_handler):
    event = DirCreatedEvent("/fake/path/new_plugin")
    plugins_dir_handler.wait_for_file = MagicMock(return_value=True)

    plugins_dir_handler.on_created(event)

    plugins_dir_handler.plugin_manager.register_plugin.assert_called_with("new_plugin")
    assert "new_plugin" in plugins_dir_handler.known_dirs


@patch("os.path.relpath")
def test_on_created_suspended(mock_relpath, plugins_dir_handler):
    plugins_dir_handler.suspend()
    event = DirCreatedEvent("/fake/path/new_plugin")

    plugins_dir_handler.on_created(event)

    plugins_dir_handler.plugin_manager.register_plugin.assert_not_called()


@patch("os.path.relpath", return_value="deleted_plugin")
def test_on_deleted_success(mock_relpath, plugins_dir_handler):
    plugins_dir_handler.known_dirs.append("deleted_plugin")
    event = DirDeletedEvent("/fake/path/deleted_plugin")

    plugins_dir_handler.on_deleted(event)

    plugins_dir_handler.plugin_manager.remove_plugin_by_dir.assert_called_with("deleted_plugin")
    assert "deleted_plugin" not in plugins_dir_handler.known_dirs


@patch("os.path.relpath")
def test_on_deleted_unknown_dir(mock_relpath, plugins_dir_handler):
    event = DirDeletedEvent("/fake/path/unknown_plugin")

    plugins_dir_handler.on_deleted(event)

    plugins_dir_handler.plugin_manager.remove_plugin_by_dir.assert_not_called()


@patch("os.path.relpath", side_effect=["old_name", "new_name"])
def test_on_moved_success(mock_relpath, plugins_dir_handler):
    plugins_dir_handler.known_dirs = ["old_name"]
    event = DirMovedEvent("/fake/path/old_name", "/fake/path/new_name")

    plugins_dir_handler.on_moved(event)

    plugins_dir_handler.plugin_manager.rename_plugin_dir.assert_called_with("new_name")
    assert "old_name" not in plugins_dir_handler.known_dirs
    assert "new_name" in plugins_dir_handler.known_dirs


@patch("os.path.relpath")
@patch("watchdog.observers.Observer")
def test_start_plugins_dir_observer(mock_observer, mock_relpath):
    with patch("mo.core.plugin.dir_observer.PluginsDirHandler"):
        from mo.core.plugin.dir_observer import start_plugins_dir_observer

        start_plugins_dir_observer()

    mock_observer_instance = mock_observer.return_value
    mock_observer_instance.schedule.assert_called_once()
    mock_observer_instance.start.assert_called_once()


@patch("os.path.relpath", return_value="new_plugin")
def test_on_created_wait_for_file_fails(mock_relpath, plugins_dir_handler, caplog):
    event = DirCreatedEvent("/fake/path/new_plugin")
    plugins_dir_handler.wait_for_file = MagicMock(return_value=False)

    plugins_dir_handler.on_created(event)

    with caplog.at_level("ERROR"):
        plugins_dir_handler.on_created(event)
    assert any(
            "Metadata file not found for plugin new_plugin" in message for message in caplog.messages)
    plugins_dir_handler.plugin_manager.register_plugin.assert_not_called()


@patch("os.path.relpath", return_value="new_plugin")
def test_on_created_handles_exception(mock_relpath, plugins_dir_handler, caplog):
    event = DirCreatedEvent("/fake/path/new_plugin")
    plugins_dir_handler.wait_for_file = MagicMock(return_value=True)
    plugins_dir_handler.plugin_manager.register_plugin.side_effect = Exception(
        "Registration Failed"
    )

    with caplog.at_level("ERROR"):
        plugins_dir_handler.on_created(event)

    assert "new_plugin" not in plugins_dir_handler.known_dirs
    assert any(
        "Failed to load plugin new_plugin" in message for message in caplog.messages
    )


@patch("os.path.relpath", return_value="deleted_plugin")
def test_on_deleted_suspended(mock_relpath, plugins_dir_handler):
    plugins_dir_handler.suspend()
    plugins_dir_handler.known_dirs.append("deleted_plugin")
    event = DirDeletedEvent("/fake/path/deleted_plugin")

    plugins_dir_handler.on_deleted(event)

    plugins_dir_handler.plugin_manager.remove_plugin_by_dir.assert_not_called()


@patch("os.path.relpath", return_value="deleted_plugin")
def test_on_deleted_handles_exception(mock_relpath, plugins_dir_handler, caplog):
    plugins_dir_handler.known_dirs.append("deleted_plugin")
    event = DirDeletedEvent("/fake/path/deleted_plugin")
    plugins_dir_handler.plugin_manager.remove_plugin_by_dir.side_effect = Exception(
        "Removal Failed"
    )
    with caplog.at_level("ERROR"):
        plugins_dir_handler.on_deleted(event)

    assert "deleted_plugin" in plugins_dir_handler.known_dirs
    assert any(
        "Failed to remove plugin deleted_plugin" in message for message in caplog.messages
    )


@patch("os.path.relpath")
def test_on_moved_suspended(mock_relpath, plugins_dir_handler):
    plugins_dir_handler.suspend()
    event = DirMovedEvent("/fake/path/old", "/fake/path/new")

    plugins_dir_handler.on_moved(event)

    plugins_dir_handler.plugin_manager.rename_plugin_dir.assert_not_called()


@patch("os.path.relpath", side_effect=["old_name", "new_name"])
def test_on_moved_handles_exception(mock_relpath, plugins_dir_handler, caplog):
    plugins_dir_handler.known_dirs = ["old_name"]
    event = DirMovedEvent("/fake/path/old_name", "/fake/path/new_name")
    plugins_dir_handler.plugin_manager.rename_plugin_dir.side_effect = Exception("Rename Failed")

    with caplog.at_level("ERROR"):
        plugins_dir_handler.on_moved(event)

    assert "old_name" in plugins_dir_handler.known_dirs
    assert "new_name" not in plugins_dir_handler.known_dirs
    assert any(
        "Failed to rename plugin old_name to new_name" in message for message in caplog.messages
    )
