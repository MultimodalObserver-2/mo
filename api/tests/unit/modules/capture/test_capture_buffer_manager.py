import multiprocessing
import queue
import threading
import time
from unittest.mock import MagicMock, patch

import pytest

from mo.core.plugin.worker_process import PluginWorkerProcess
from mo.modules.capture.plugins.capture_plugin import CaptureData
from mo.modules.capture.schemas.capture import PluginData
from mo.modules.capture.services.capture_buffer_manager import CaptureBufferManager


@pytest.fixture
def mock_queue():
    q = MagicMock(spec=multiprocessing.Queue)
    q.get = MagicMock()
    q.get_nowait = MagicMock()
    q.empty = MagicMock()
    q.close = MagicMock()
    q.join_thread = MagicMock()
    return q


@pytest.fixture
def capture_buffer_manager(mock_queue):
    manager = CaptureBufferManager(
        execution_lock=threading.Lock(), flush_interval=0.1, monitor_interval=0.1
    )
    manager.queue = mock_queue
    manager.processes = {"plugin1": MagicMock(spec=PluginWorkerProcess)}
    yield manager
    if manager.started:
        manager.stop(timeout=0.2)


def test_initialization():
    lock = threading.Lock()
    on_capture_data_callback = MagicMock()
    manager = CaptureBufferManager(
        execution_lock=lock,
        flush_interval=2.0,
        memory_limit=80,
        on_capture_data=on_capture_data_callback,
    )
    assert manager.execution_lock is lock
    assert manager.flush_interval == 2.0
    assert manager.memory_limit == 80
    assert manager.on_capture_data is on_capture_data_callback
    assert manager.started is False


def test_start_initializes_buffers_and_starts_threads(capture_buffer_manager, mock_queue):
    with patch("threading.Thread") as mock_thread_class:
        buffer_tuples = [("plugin1", "config1"), ("plugin2", "config2")]
        mock_processes = {
            "plugin1": MagicMock(spec=PluginWorkerProcess),
            "plugin2": MagicMock(spec=PluginWorkerProcess),
        }

        capture_buffer_manager.start(buffer_tuples, mock_queue, mock_processes)

        assert capture_buffer_manager.started is True
        assert ("plugin1", "config1") in capture_buffer_manager.buffers
        assert ("plugin2", "config2") in capture_buffer_manager.buffers
        assert mock_thread_class.call_count == 3

        for _ in mock_thread_class.call_args_list:
            thread_instance = mock_thread_class.return_value
            thread_instance.start.assert_called()


def test_stop_joins_threads_and_flushes_final_data(capture_buffer_manager):
    capture_buffer_manager.captured_data_thread = MagicMock(spec=threading.Thread)
    capture_buffer_manager.flush_buffers_thread = MagicMock(spec=threading.Thread)
    capture_buffer_manager.stressed_monitor_thread = MagicMock(spec=threading.Thread)
    capture_buffer_manager.move_queue_to_buffers = MagicMock()
    capture_buffer_manager.flush_buffers = MagicMock()

    capture_buffer_manager.stop()

    assert capture_buffer_manager.started is False
    capture_buffer_manager.captured_data_thread.join.assert_called()
    capture_buffer_manager.flush_buffers_thread.join.assert_called()
    capture_buffer_manager.stressed_monitor_thread.join.assert_called()
    capture_buffer_manager.move_queue_to_buffers.assert_called_once()
    capture_buffer_manager.queue.close.assert_called_once()
    capture_buffer_manager.queue.join_thread.assert_called_once()
    capture_buffer_manager.flush_buffers.assert_called_with(end_of_data=True)


def test_flush_buffers_executes_callback(capture_buffer_manager):
    plugin_id, config_name = "plugin1", "config1"
    capture_buffer_manager.buffers[(plugin_id, config_name)].add(
        CaptureData(timestamp=time.time(), data=b"123")
    )
    mock_process = capture_buffer_manager.processes[plugin_id]
    mock_process.is_alive.return_value = True
    capture_buffer_manager.is_on_time = MagicMock(return_value=True)

    exceptions = capture_buffer_manager.flush_buffers()

    assert not exceptions
    mock_process.execute_callback_on_instance.assert_called_once()
    args = mock_process.execute_callback_on_instance.call_args[0][2]
    assert len(args["data"]) == 1
    assert args["data"][0].data == b"123"
    assert capture_buffer_manager.buffers[(plugin_id, config_name)].is_empty()


def test_flush_buffers_filters_data_by_timestamp(capture_buffer_manager):
    plugin_id, config_name = "plugin1", "config1"
    capture_buffer_manager.buffers[(plugin_id, config_name)].add(
        CaptureData(timestamp=1.0, data=b"on_time")
    )
    capture_buffer_manager.buffers[(plugin_id, config_name)].add(
        CaptureData(timestamp=2.0, data=b"paused")
    )
    mock_process = capture_buffer_manager.processes[plugin_id]
    mock_process.is_alive.return_value = True
    capture_buffer_manager.is_on_time = MagicMock(side_effect=lambda ts: ts == 1.0)

    capture_buffer_manager.flush_buffers()

    args = mock_process.execute_callback_on_instance.call_args[0][2]
    assert len(args["data"]) == 1
    assert args["data"][0].data == b"on_time"


@patch("psutil.virtual_memory")
@patch("psutil.swap_memory")
def test_is_stressed_returns_true_on_high_memory(mock_swap, mock_mem, capture_buffer_manager):
    mock_mem.return_value.percent = 90
    mock_swap.return_value.percent = 20
    assert capture_buffer_manager.is_stressed() is True


@patch("psutil.virtual_memory")
@patch("psutil.swap_memory")
def test_is_stressed_returns_false_on_low_memory(mock_swap, mock_mem, capture_buffer_manager):
    mock_mem.return_value.percent = 50
    mock_swap.return_value.percent = 10
    assert capture_buffer_manager.is_stressed() is False


def test_move_queue_to_buffers_transfers_data(capture_buffer_manager):
    plugin_id, config_name = "plugin1", "config1"
    d1 = PluginData(plugin_id=plugin_id, config_name=config_name, timestamp=1.0, data=b"a")
    d2 = PluginData(plugin_id=plugin_id, config_name=config_name, timestamp=2.0, data=b"b")

    capture_buffer_manager.queue.empty.side_effect = [False, False, False, True, True]
    capture_buffer_manager.queue.get_nowait.side_effect = [d1, d2]

    capture_buffer_manager.buffers.clear()
    capture_buffer_manager.move_queue_to_buffers()

    buffer_content = capture_buffer_manager.buffers[(plugin_id, config_name)].get_all_and_clear()
    assert len(buffer_content) == 2
    assert buffer_content[0].data == b"a"
    assert buffer_content[1].data == b"b"


def test_get_captured_data_worker_processes_item_from_queue(capture_buffer_manager):
    plugin_id, config_name = "plugin1", "config1"
    plugin_data = PluginData(plugin_id=plugin_id, config_name=config_name, timestamp=1.0, data=b"a")

    capture_buffer_manager.on_capture_data = MagicMock()
    capture_buffer_manager.started = True

    def get_and_stop(*args, **kwargs):
        capture_buffer_manager.started = False
        return plugin_data

    capture_buffer_manager.queue.get.side_effect = get_and_stop

    capture_buffer_manager.get_captured_data_worker()

    capture_buffer_manager.on_capture_data.assert_called_with(plugin_data)

    buffer_content = capture_buffer_manager.buffers[(plugin_id, config_name)].get_all_and_clear()
    assert len(buffer_content) == 1

    captured_item = buffer_content[0]
    assert isinstance(captured_item, CaptureData)
    assert captured_item.data == plugin_data.data
    assert captured_item.timestamp == plugin_data.timestamp


def test_get_captured_data_worker_handles_invalid_data(capture_buffer_manager):
    capture_buffer_manager.on_capture_data = MagicMock()
    capture_buffer_manager.started = True

    class MockGetAndStop:
        def __init__(self):
            self.side_effects = [None, "not_a_plugin_data_object", queue.Empty()]

        def __call__(self, *args, **kwargs):
            try:
                val = self.side_effects.pop(0)
                if not self.side_effects:
                    capture_buffer_manager.started = False

                if isinstance(val, queue.Empty):
                    raise queue.Empty

                return val
            except IndexError:
                capture_buffer_manager.started = False
                raise queue.Empty

    capture_buffer_manager.queue.get.side_effect = MockGetAndStop()

    capture_buffer_manager.get_captured_data_worker()

    capture_buffer_manager.on_capture_data.assert_not_called()
    assert all(buf.is_empty() for buf in capture_buffer_manager.buffers.values())


def test_is_on_time_with_paused_intervals(capture_buffer_manager):
    capture_buffer_manager.add_paused_interval(10.0, 20.0)
    capture_buffer_manager.add_paused_interval(30.0, None)

    assert capture_buffer_manager.is_on_time(5.0) is True
    assert capture_buffer_manager.is_on_time(25.0) is True
    assert capture_buffer_manager.is_on_time(15.0) is False
    assert capture_buffer_manager.is_on_time(35.0) is False


def test_flush_buffers_skips_when_all_data_filtered(capture_buffer_manager):
    plugin_id, config_name = "plugin1", "config1"
    capture_buffer_manager.buffers[(plugin_id, config_name)].add(
        CaptureData(timestamp=1.0, data=b"data")
    )
    mock_process = capture_buffer_manager.processes[plugin_id]
    mock_process.is_alive.return_value = True
    capture_buffer_manager.is_on_time = MagicMock(return_value=False)

    capture_buffer_manager.flush_buffers(end_of_data=False)

    mock_process.execute_callback_on_instance.assert_not_called()


def test_flush_buffers_catches_exception_from_callback(capture_buffer_manager):
    plugin_id, config_name = "plugin1", "config1"
    capture_buffer_manager.buffers[(plugin_id, config_name)].add(
        CaptureData(timestamp=1.0, data=b"data")
    )
    mock_process = capture_buffer_manager.processes[plugin_id]
    mock_process.is_alive.return_value = True
    mock_process.execute_callback_on_instance.side_effect = RuntimeError("Callback Failed")
    capture_buffer_manager.is_on_time = MagicMock(return_value=True)

    exceptions = capture_buffer_manager.flush_buffers()

    assert (plugin_id, config_name) in exceptions
    assert isinstance(exceptions[(plugin_id, config_name)], RuntimeError)


def test_flush_buffers_periodically_worker_one_cycle(capture_buffer_manager):
    capture_buffer_manager.started = True
    capture_buffer_manager.is_stressed = MagicMock(return_value=False)

    capture_buffer_manager.flush_buffers = MagicMock(
        side_effect=lambda *args, **kwargs: setattr(capture_buffer_manager, "started", False)
    )

    capture_buffer_manager.flush_buffers_periodically_worker()

    capture_buffer_manager.is_stressed.assert_called_once()
    capture_buffer_manager.flush_buffers.assert_called_once()


def test_stressed_monitor_worker_flushes_when_stressed(capture_buffer_manager):
    capture_buffer_manager.started = True
    capture_buffer_manager.is_stressed = MagicMock(return_value=True)
    capture_buffer_manager.flush_buffers = MagicMock(
        side_effect=lambda *args, **kwargs: setattr(capture_buffer_manager, "started", False)
    )

    capture_buffer_manager.stressed_monitor_worker()

    capture_buffer_manager.is_stressed.assert_called_once()
    capture_buffer_manager.flush_buffers.assert_called_with(end_of_data=False)


def test_paused_interval_methods(capture_buffer_manager):
    capture_buffer_manager.add_paused_interval(10.0, 20.0)
    capture_buffer_manager.add_paused_interval(30.0, None)
    intervals = capture_buffer_manager.get_paused_intervals()
    assert intervals == [(10.0, 20.0), (30.0, None)]

    capture_buffer_manager.patch_last_paused_interval(start=None, end=40.0)
    intervals = capture_buffer_manager.get_paused_intervals()
    assert intervals == [(10.0, 20.0), (30.0, 40.0)]

    capture_buffer_manager.clear_paused_intervals()
    intervals = capture_buffer_manager.get_paused_intervals()
    assert not intervals


def test_stressed_monitor_worker_handles_flush_exceptions(capture_buffer_manager):
    capture_buffer_manager.started = True
    capture_buffer_manager.is_stressed = MagicMock(return_value=True)
    test_exception = ValueError("Flush Failed")

    def flush_and_stop(*args, **kwargs):
        capture_buffer_manager.started = False
        return {("plugin1", "config1"): test_exception}

    capture_buffer_manager.flush_buffers = MagicMock(side_effect=flush_and_stop)

    all_exceptions = capture_buffer_manager.stressed_monitor_worker()

    capture_buffer_manager.flush_buffers.assert_called_once()
    assert ("plugin1", "config1") in all_exceptions
    assert all_exceptions[("plugin1", "config1")][0] is test_exception


def test_stressed_monitor_worker_waits_when_not_stressed(capture_buffer_manager):
    capture_buffer_manager.started = True
    capture_buffer_manager.is_stressed = MagicMock(return_value=False)
    capture_buffer_manager.flush_buffers = MagicMock()

    with patch("threading.Event") as mock_event_class:
        mock_event_instance = mock_event_class.return_value

        def wait_and_stop(*args, **kwargs):
            capture_buffer_manager.started = False

        mock_event_instance.wait.side_effect = wait_and_stop

        capture_buffer_manager.stressed_monitor_worker()

        capture_buffer_manager.is_stressed.assert_called_once()
        capture_buffer_manager.flush_buffers.assert_not_called()
        mock_event_instance.wait.assert_called_with(capture_buffer_manager.monitor_interval)


def test_move_queue_to_buffers_skips_invalid_data(capture_buffer_manager):
    capture_buffer_manager.queue.empty.side_effect = [False, False, False, False, True, True]
    capture_buffer_manager.queue.get_nowait.side_effect = [None, "invalid_data"]
    capture_buffer_manager.buffers.clear()

    capture_buffer_manager.move_queue_to_buffers()

    assert not capture_buffer_manager.buffers


def test_flush_buffers_skips_none_process(capture_buffer_manager):
    plugin_id, config_name = "non_existent_plugin", "config1"
    capture_buffer_manager.buffers[(plugin_id, config_name)].add(
        CaptureData(timestamp=1.0, data=b"data")
    )

    exceptions = capture_buffer_manager.flush_buffers()

    assert not exceptions
    assert not capture_buffer_manager.buffers[(plugin_id, config_name)].is_empty()


def test_flush_buffers_periodically_worker_when_stressed(capture_buffer_manager):
    capture_buffer_manager.started = True
    capture_buffer_manager.is_stressed = MagicMock(
        side_effect=lambda: setattr(capture_buffer_manager, "started", False) or True
    )
    capture_buffer_manager.flush_buffers = MagicMock()

    capture_buffer_manager.flush_buffers_periodically_worker()

    capture_buffer_manager.is_stressed.assert_called_once()
    capture_buffer_manager.flush_buffers.assert_not_called()


def test_flush_buffers_periodically_worker_handles_exceptions(capture_buffer_manager):
    capture_buffer_manager.started = True
    capture_buffer_manager.is_stressed = MagicMock(return_value=False)
    test_exception = ValueError("Flush Error")

    def flush_and_stop(*args, **kwargs):
        setattr(capture_buffer_manager, "started", False)
        return {("plugin1", "config1"): test_exception}

    capture_buffer_manager.flush_buffers = MagicMock(side_effect=flush_and_stop)

    all_exceptions = capture_buffer_manager.flush_buffers_periodically_worker()

    capture_buffer_manager.flush_buffers.assert_called_once()
    assert ("plugin1", "config1") in all_exceptions
    assert all_exceptions[("plugin1", "config1")][0] is test_exception


def test_pause_resume(capture_buffer_manager):
    capture_buffer_manager.pause(10.0)

    assert capture_buffer_manager.last_pause == 10.0
    assert (10.0, None) in capture_buffer_manager.get_paused_intervals()

    capture_buffer_manager.resume(20.0)
    assert capture_buffer_manager.last_pause is None
    assert (10.0, 20.0) in capture_buffer_manager.get_paused_intervals()
