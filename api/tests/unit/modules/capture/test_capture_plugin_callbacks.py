import multiprocessing
import time
from unittest.mock import MagicMock, patch

import pytest

from mo.core.plugin.models.plugin import Plugin
from mo.core.plugin.worker_process import PluginProcessMetadata
from mo.modules.capture.plugins.capture_plugin import CaptureData, CapturePlugin
from mo.modules.capture.schemas.capture import PluginData
from mo.modules.capture.services.capture_plugin_callbacks import (
    get_file_extension_callback,
    pause_callback,
    prepare_callback,
    resume_callback,
    save_callback,
    start_callback,
    stop_callback,
)


@pytest.fixture
def mock_capture_plugin():
    plugin = MagicMock(spec=CapturePlugin)
    return plugin


@pytest.fixture
def mock_generic_plugin():
    plugin = MagicMock(spec=Plugin)
    return plugin


def test_prepare_callback_success(mock_capture_plugin):
    extra_args = {"session_path": "/tmp/session", "file_name": "test_file"}
    prepare_callback(mock_capture_plugin, extra_args)
    mock_capture_plugin.prepare.assert_called_with("/tmp/session", "test_file")


def test_prepare_callback_invalid_instance(mock_generic_plugin):
    mock_generic_plugin.prepare = MagicMock()
    prepare_callback(mock_generic_plugin, {})
    mock_generic_plugin.prepare.assert_not_called()


@patch("threading.Thread")
def test_start_callback_success(mock_thread, mock_capture_plugin):
    extra_args = {"config_name": "c1", "start_ts": 12345.0}
    mock_queue = MagicMock(spec=multiprocessing.Queue)
    mock_metadata = MagicMock(spec=PluginProcessMetadata)

    start_callback(mock_capture_plugin, extra_args, mock_queue, mock_metadata)

    mock_thread.assert_called_once()
    thread_instance = mock_thread.return_value
    thread_instance.start.assert_called_once()

    call_args = mock_thread.call_args.kwargs
    assert call_args["target"] == mock_capture_plugin.start
    assert call_args["args"][0] == extra_args["start_ts"]


def test_start_callback_invalid_instance(mock_generic_plugin):
    mock_generic_plugin.start = MagicMock()
    mock_queue = MagicMock(spec=multiprocessing.Queue)
    mock_metadata = MagicMock(spec=PluginProcessMetadata)
    mock_metadata.metadata = MagicMock()
    mock_metadata.metadata.get_final_id = MagicMock()
    mock_metadata.metadata.get_final_id.return_value = "plugin.id"
    mock_queue.put = MagicMock()

    start_callback(mock_generic_plugin, {}, mock_queue, mock_metadata)

    mock_generic_plugin.start.assert_not_called()
    mock_queue.put.assert_not_called()
    mock_metadata.metadata.get_final_id.assert_not_called()


def test_start_callback_on_data_callback_puts_to_queue():
    mock_queue = MagicMock(spec=multiprocessing.Queue)
    mock_metadata = MagicMock(spec=PluginProcessMetadata)
    mock_metadata.metadata = MagicMock()
    mock_metadata.metadata.get_final_id = MagicMock()
    mock_metadata.metadata.get_final_id.return_value = "plugin.id"
    mock_queue.put = MagicMock()

    with patch("threading.Thread") as mock_thread:
        start_callback(
            MagicMock(spec=CapturePlugin),
            {"config_id": "c1", "start_ts": time.monotonic()},
            mock_queue,
            mock_metadata,
        )
        on_data_callback = mock_thread.call_args.kwargs["args"][2]

    capture_data = CaptureData(timestamp=time.time(), data=b"some_data")
    on_data_callback(capture_data)

    mock_queue.put.assert_called_once()
    plugin_data_arg = mock_queue.put.call_args[0][0]
    assert isinstance(plugin_data_arg, PluginData)
    assert plugin_data_arg.config_id == "c1"
    assert plugin_data_arg.data == b"some_data"


def test_start_callback_on_data_callback_error_handling():
    mock_queue = MagicMock(spec=multiprocessing.Queue)
    mock_metadata = MagicMock(spec=PluginProcessMetadata)
    mock_metadata.metadata = MagicMock()
    mock_metadata.metadata.get_final_id = MagicMock()
    mock_metadata.metadata.get_final_id.return_value = "plugin.id"
    mock_queue.put = MagicMock(side_effect=Exception("Queue error"))

    with patch("threading.Thread") as mock_thread:
        start_callback(
            MagicMock(spec=CapturePlugin),
            {"config_name": "c1", "start_ts": time.monotonic()},
            mock_queue,
            mock_metadata,
        )
        on_data_callback = mock_thread.call_args.kwargs["args"][2]

    capture_data = CaptureData(timestamp=time.time(), data=b"some_data")
    on_data_callback(capture_data)

    mock_queue.put.assert_called_once()


def test_stop_callback_success(mock_capture_plugin):
    extra_args = {"stop_ts": 12345.0}
    stop_callback(mock_capture_plugin, extra_args)
    mock_capture_plugin.stop.assert_called_with(12345.0)


def test_pause_callback_success(mock_capture_plugin):
    extra_args = {"pause_ts": 123.0}
    pause_callback(mock_capture_plugin, extra_args)
    mock_capture_plugin.pause.assert_called_with(123.0)


def test_resume_callback_success(mock_capture_plugin):
    extra_args = {"resume_ts": 456.0}
    resume_callback(mock_capture_plugin, extra_args)
    mock_capture_plugin.resume.assert_called_with(456.0)


def test_get_file_extension_callback_success(mock_capture_plugin):
    mock_capture_plugin.get_file_extension.return_value = "csv"
    result = get_file_extension_callback(mock_capture_plugin)
    assert result == "csv"
    mock_capture_plugin.get_file_extension.assert_called_once()


def test_get_file_extension_callback_invalid_instance(mock_generic_plugin):
    mock_generic_plugin.get_file_extension = MagicMock()
    result = get_file_extension_callback(mock_generic_plugin)
    assert result == ""
    mock_generic_plugin.get_file_extension.assert_not_called()


def test_save_callback_success(mock_capture_plugin):
    capture_list = [CaptureData(timestamp=1.0, data=b"d1")]
    extra_args = {"data": capture_list, "end_of_data": True}

    save_callback(mock_capture_plugin, extra_args)

    mock_capture_plugin.save.assert_called_with(capture_list, True)


def test_save_callback_invalid_instance(mock_generic_plugin):
    mock_generic_plugin.save = MagicMock()
    save_callback(mock_generic_plugin, {})
    mock_generic_plugin.save.assert_not_called()
