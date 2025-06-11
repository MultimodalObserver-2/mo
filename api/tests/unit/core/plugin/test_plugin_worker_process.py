from multiprocessing import Process
from multiprocessing.connection import PipeConnection
from unittest.mock import MagicMock, patch

import pytest

from mo.core.plugin.models.plugin import Plugin, PluginMetadata
from mo.core.plugin.models.properties import Properties
from mo.core.plugin.models.settings import Settings
from mo.core.plugin.worker_process import PluginProcessMetadata, PluginWorkerProcess


@pytest.fixture
def mock_process_metadata():
    metadata = PluginProcessMetadata(
        dir_name="test_plugin",
        entry_points={
            "mo.plugin": "src.test_plugin:TestPlugin",
            "mo.plugin.properties": "src.test_properties",
        },
        initial_settings=Settings({"setting1": "value1", "setting2": "value2"}),
        check_types=[Plugin],
        status_queue=MagicMock(),
        metadata=MagicMock(spec=PluginMetadata),
    )
    return metadata


@pytest.fixture
def worker_process(mock_process_metadata):
    with (
        patch.object(Process, "__init__"),
        patch("mo.core.plugin.worker_process.Pipe") as mock_pipe,
    ):

        mock_parent_conn = MagicMock(spec=PipeConnection)
        mock_child_conn = MagicMock(spec=PipeConnection)
        mock_pipe.return_value = (mock_parent_conn, mock_child_conn)

        process = PluginWorkerProcess(mock_process_metadata)
    return process


def test_run_success_path(worker_process):
    mock_plugin_class = MagicMock()
    mock_plugin_instance = MagicMock(spec=Plugin)
    mock_plugin_class.return_value = mock_plugin_instance
    worker_process.load_main_instance = True
    mock_settings = MagicMock(spec=Settings)
    worker_process.process_metadata.initial_settings = mock_settings

    mock_plugin_class._module_name = "test.module"
    worker_process.process_metadata.check_types = []

    worker_process._PluginWorkerProcess__load_plugin = MagicMock(return_value=mock_plugin_class)
    worker_process._PluginWorkerProcess__load_properties = MagicMock(return_value=MagicMock())
    worker_process._event_loop = MagicMock()

    worker_process.run()

    worker_process.process_metadata.status_queue.put.assert_called_once()
    status_arg = worker_process.process_metadata.status_queue.put.call_args[0][0]

    assert status_arg["is_loaded"] is True
    assert status_arg["module_name"] == "test.module"
    mock_plugin_instance.unload.assert_called_once()
    mock_plugin_instance.configure.assert_called_once_with(mock_settings)


def test_run_handles_load_exception(worker_process):
    with patch.object(
        worker_process,
        "_PluginWorkerProcess__load_plugin",
        side_effect=ImportError("Failed to load"),
    ):
        worker_process.run()

    worker_process.process_metadata.status_queue.put.assert_called_once()
    status_arg = worker_process.process_metadata.status_queue.put.call_args[0][0]
    assert status_arg["is_loaded"] is False
    assert "Failed to load" in status_arg["error"]


def test_handle_add_plugin_instance_success(worker_process):
    mock_plugin_class = MagicMock()
    mock_plugin_instance = MagicMock(spec=Plugin)
    mock_plugin_class.return_value = mock_plugin_instance
    worker_process.plugin_class = mock_plugin_class

    result = worker_process._handle_add_plugin_instance("instance1", Settings())

    assert "instance1" in worker_process.plugins_instances
    mock_plugin_instance.load.assert_called_once()
    mock_plugin_instance.configure.assert_called_once()
    assert result == {"is_ok": True}


def test_handle_add_plugin_instance_already_exists(worker_process):
    worker_process.plugins_instances["instance1"] = MagicMock()
    with pytest.raises(ValueError, match="already exists"):
        worker_process._handle_add_plugin_instance("instance1", None)


def test_handle_remove_plugin_instance_success(worker_process):
    mock_plugin_instance = MagicMock(spec=Plugin)
    worker_process.plugins_instances = {"instance1": mock_plugin_instance}
    worker_process.plugins_instances_ids = ["instance1"]

    result = worker_process._handle_remove_plugin_instance("instance1")

    assert "instance1" not in worker_process.plugins_instances
    mock_plugin_instance.unload.assert_called_once()
    assert result == {"is_ok": True}


def test_handle_remove_plugin_instance_does_not_exist(worker_process):
    with pytest.raises(ValueError, match="does not exist"):
        worker_process._handle_remove_plugin_instance("instance1")


def test_add_plugin_instance_sends_command(worker_process):
    mock_settings = MagicMock(spec=Settings)
    worker_process._parent_conn.recv.return_value = {"is_ok": True}

    worker_process.add_plugin_instance("instance1", mock_settings)

    worker_process._parent_conn.send.assert_called_with(
        ("add_plugin_instance", "instance1", mock_settings)
    )
    assert "instance1" in worker_process.plugins_instances_ids


def test_remove_plugin_instance_sends_command(worker_process):
    worker_process.plugins_instances_ids = ["instance1"]
    worker_process._parent_conn.recv.return_value = {"is_ok": True}

    worker_process.remove_plugin_instance("instance1")

    worker_process._parent_conn.send.assert_called_with(("remove_plugin_instance", "instance1"))
    assert "instance1" not in worker_process.plugins_instances_ids


def test_stop_sends_command(worker_process):
    worker_process._parent_conn.recv.return_value = {"is_ok": True}
    worker_process.join = MagicMock()

    worker_process.stop()

    worker_process._parent_conn.send.assert_called_with(("stop",))
    worker_process.join.assert_called_once()


def test_execute_callback_on_instance_sends_command(worker_process):
    def callback():
        return "test"

    args = {"arg": 1}
    worker_process._parent_conn.recv.return_value = {"is_ok": True, "result": "callback_result"}

    result = worker_process.execute_callback_on_instance("id1", callback, args)

    assert result == "callback_result"
    worker_process._parent_conn.send.assert_called_with(
        ("execute_callback_on_instance", "id1", callback, args, True)
    )


@patch("time.time", side_effect=[100.0, 100.1, 102.0])
def test_event_loop_times_out(mock_time, worker_process):
    worker_process.keep_running = True
    worker_process.timeout = 1
    worker_process._child_conn.poll.return_value = False

    worker_process._event_loop()
    assert worker_process.keep_running is False


def test_handle_command(worker_process):
    worker_process._handle_stop = MagicMock(return_value={"is_ok": True})

    result = worker_process.handle_command("stop")

    assert result == {"is_ok": True}

    none_result = worker_process.handle_command("unknown_command")
    assert none_result is None


def test_handle_get_properties(worker_process):
    worker_process.properties = MagicMock(spec=Properties)
    worker_process.properties.get_properties_dict.return_value = [{"prop": "value"}]

    result = worker_process._handle_get_properties()

    assert result == [{"prop": "value"}]
    worker_process.properties.get_properties_dict.assert_called_with(None)


def test_handle_validate_settings(worker_process):
    worker_process.properties = MagicMock(spec=Properties)

    # Success case
    result_ok = worker_process._handle_validate_settings(None)
    assert result_ok == {"is_valid": True}

    # Failure case
    worker_process.properties.validate.side_effect = ValueError("Invalid setting")
    result_fail = worker_process._handle_validate_settings(None)
    assert result_fail["is_valid"] is False
    assert isinstance(result_fail["exception"], ValueError)


def test_handle_add_plugin_instance_class_is_none(worker_process):
    worker_process.plugin_class = None
    with pytest.raises(RuntimeError, match="Plugin class is not loaded"):
        worker_process._handle_add_plugin_instance("id1", None)


def test_handle_execute_callback_on_instance(worker_process):
    mock_instance = MagicMock(spec=Plugin)
    worker_process.plugins_instances["id1"] = mock_instance
    mock_callback = MagicMock(return_value="callback_result")

    result = worker_process._handle_execute_callback_on_instance("id1", mock_callback, {}, True)

    assert result["is_ok"] is True
    assert result["result"] == "callback_result"
    mock_callback.assert_called_once()


def test_handle_set_timeout(worker_process):
    worker_process._handle_set_timeout(30.0)
    assert worker_process.timeout == 30.0


def test_handle_stop(worker_process):
    worker_process.keep_running = True
    result = worker_process._handle_stop()
    assert worker_process.keep_running is False
    assert result == {"is_ok": True}


def test_stop_raises_on_failure_response(worker_process):
    error = ValueError("Stop failed")
    worker_process._parent_conn.recv.return_value = {"is_ok": False, "exception": error}

    with pytest.raises(ValueError, match="Stop failed"):
        worker_process.stop()


def test_stop_force_terminates(worker_process):
    worker_process._parent_conn.recv.return_value = {"is_ok": True}
    worker_process.join = MagicMock()
    worker_process.is_alive = MagicMock(return_value=False)
    worker_process.terminate = MagicMock()

    worker_process.stop(timeout=None, force=True)

    worker_process.terminate.assert_called_once()


def test_stop_force_terminates_after_timeout(worker_process):
    worker_process._parent_conn.recv.return_value = {"is_ok": True}
    worker_process.join = MagicMock()
    worker_process.is_alive = MagicMock(return_value=True)
    worker_process.terminate = MagicMock()

    worker_process.stop(timeout=0.1, force=True)

    worker_process.terminate.assert_called_once()


def test_validate_settings(worker_process):
    worker_process._parent_conn.recv.return_value = {"is_valid": True}
    mock_settings = MagicMock(spec=Settings)

    worker_process.validate_settings(mock_settings)

    worker_process._parent_conn.send.assert_called_with(("validate_settings", mock_settings))


def test_add_plugin_instance_raises_on_failure(worker_process):
    worker_process._parent_conn.recv.return_value = {
        "is_ok": False,
        "exception": ValueError("add failed"),
    }
    with pytest.raises(ValueError, match="add failed"):
        worker_process.add_plugin_instance("id1", None)


def test_execute_callback_on_instance(worker_process):
    mock_instance = MagicMock(spec=Plugin)
    worker_process.plugins_instances["id1"] = mock_instance
    mock_callback = MagicMock(return_value="result")

    result = worker_process._execute_callback_on_instance("id1", mock_callback, {})

    assert result == "result"
    mock_callback.assert_called_with(mock_instance, {}, None, worker_process.process_metadata)


def test_execute_callback_on_all_instances(worker_process):
    worker_process.plugins_instances_ids = ["id1", "id2"]
    worker_process.execute_callback_on_instance = MagicMock()

    worker_process.execute_callback_on_all_instances(MagicMock())

    assert worker_process.execute_callback_on_instance.call_count == 2


def test_execute_callback_on_instance_no_response(worker_process):
    result = worker_process.execute_callback_on_instance("id1", MagicMock(), need_response=False)
    assert result is True
    worker_process._parent_conn.recv.assert_not_called()


def test_execute_callback_on_instance_raises_on_failure(worker_process):
    worker_process._parent_conn.recv.return_value = {
        "is_ok": False,
        "exception": ValueError("exec failed"),
    }
    with pytest.raises(ValueError, match="exec failed"):
        worker_process.execute_callback_on_instance("id1", MagicMock())


def test_get_properties(worker_process):
    worker_process._parent_conn.recv.return_value = [{"prop": "value"}]
    result = worker_process.get_properties(None)
    assert result == [{"prop": "value"}]
    worker_process._parent_conn.send.assert_called_with(("get_properties", None))


def test_set_timeout(worker_process):
    worker_process.set_timeout(60.0)
    assert worker_process.timeout == 60.0
    worker_process._parent_conn.send.assert_called_with(("set_timeout", 60.0))


def test_load_symbol_entry_point_is_none(worker_process):
    worker_process._PluginWorkerProcess__get_entry_point = MagicMock(return_value=None)
    result = worker_process._PluginWorkerProcess__load_symbol("group")
    assert result is None


@patch("importlib.util.spec_from_file_location", return_value=None)
def test_load_symbol_spec_is_none(mock_spec, worker_process):
    worker_process._PluginWorkerProcess__get_entry_point = MagicMock(return_value=("mod", "sym"))
    with patch("os.path.exists", return_value=True):
        result = worker_process._PluginWorkerProcess__load_symbol("group")
    assert result is None


def test_load_plugin_entry_point_is_none(worker_process):
    worker_process._PluginWorkerProcess__get_entry_point = MagicMock(return_value=None)
    with pytest.raises(ImportError):
        worker_process._PluginWorkerProcess__load_plugin()


def test_load_plugin_symbol_is_none(worker_process):
    worker_process._PluginWorkerProcess__get_entry_point = MagicMock(return_value=("mod", "sym"))
    worker_process._PluginWorkerProcess__load_symbol = MagicMock(return_value=None)
    with pytest.raises(ImportError):
        worker_process._PluginWorkerProcess__load_plugin()


def test_load_properties_symbol_is_none(worker_process):
    worker_process._PluginWorkerProcess__get_entry_point = MagicMock(return_value=("mod", "sym"))
    worker_process._PluginWorkerProcess__load_symbol = MagicMock(return_value=None)
    with pytest.raises(ImportError):
        worker_process._PluginWorkerProcess__load_properties()


def test_load_properties_instance_is_not_properties(worker_process):
    worker_process._PluginWorkerProcess__get_entry_point = MagicMock(return_value=("mod", "sym"))
    worker_process._PluginWorkerProcess__load_symbol = MagicMock(
        return_value="not a properties instance"
    )
    with pytest.raises(ImportError):
        worker_process._PluginWorkerProcess__load_properties()


def test_event_loop_receives_command(worker_process):
    worker_process.keep_running = True
    worker_process._child_conn.poll.return_value = True
    worker_process._child_conn.recv.return_value = ("stop",)

    def handle_command_and_stop(command, *args):
        worker_process.keep_running = False
        return worker_process._handle_stop()

    worker_process.handle_command = MagicMock(side_effect=handle_command_and_stop)

    worker_process._event_loop()

    worker_process.handle_command.assert_called_with("stop")


def test_handle_execute_callback_on_instance_exception(worker_process):
    test_exception = ValueError("Execution Failed")
    worker_process._execute_callback_on_instance = MagicMock(side_effect=test_exception)

    with pytest.raises(ValueError, match="Execution Failed"):
        worker_process._handle_execute_callback_on_instance("id1", MagicMock(), {}, True)

    result_no_response = worker_process._handle_execute_callback_on_instance(
        "id1", MagicMock(), {}, False
    )

    assert result_no_response is None


def test_remove_plugin_instance_handles_failure_response(worker_process):
    error = ValueError("remove failed")
    worker_process._parent_conn.recv.return_value = {"is_ok": False, "exception": error}

    with pytest.raises(ValueError, match="remove failed"):
        worker_process.remove_plugin_instance("id1")


def test_execute_callback_on_instance_not_found(worker_process):
    worker_process.plugins_instances = {}
    with pytest.raises(ValueError, match="does not exist"):
        worker_process._execute_callback_on_instance("id1", MagicMock(), {})


@patch("os.path.exists", return_value=False)
def test_load_symbol_file_not_found(mock_exists, worker_process):
    worker_process._PluginWorkerProcess__get_entry_point = MagicMock(
        return_value=("module.py", "symbol")
    )
    with pytest.raises(FileNotFoundError):
        worker_process._PluginWorkerProcess__load_symbol("group")


def test_event_loop_handles_command_exception(worker_process):
    worker_process.keep_running = True
    worker_process._child_conn.poll.return_value = True
    worker_process._child_conn.recv.return_value = ("some_command",)

    test_exception = ValueError("Handler Failed")

    def stop_loop_and_raise_error(*args, **kwargs):
        worker_process.keep_running = False
        raise test_exception

    worker_process.handle_command = MagicMock(side_effect=stop_loop_and_raise_error)

    worker_process._event_loop()

    worker_process._child_conn.send.assert_called_with(
        {"is_ok": False, "exception": test_exception}
    )


def test_validate_settings_raises_on_failure(worker_process):
    test_exception = ValueError("Validation Failed")
    worker_process._parent_conn.recv.return_value = {"is_valid": False, "exception": test_exception}

    with pytest.raises(ValueError, match="Validation Failed"):
        worker_process.validate_settings(None)
