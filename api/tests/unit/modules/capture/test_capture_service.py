import logging
import logging.handlers
from datetime import datetime
from unittest.mock import MagicMock, patch, AsyncMock

import pytest

from mo.core.config import constants
from mo.core.plugin.worker_process import PluginWorkerProcess
from mo.core.utils.http_exceptions import BadRequestException
from mo.modules.capture.schemas.capture import PluginData
from mo.modules.capture.schemas.session import CaptureConfigDetailsPost, SessionPut, SessionRes
from mo.modules.capture.services.capture_plugin_callbacks import prepare_callback, start_callback
from mo.modules.capture.services.capture_service import CaptureService


@pytest.fixture
def capture_service():
    with patch.object(CaptureService, "__init__", return_value=None):
        service = CaptureService()
        service.session_service = MagicMock()
        service.plugin_management = MagicMock()
        service.config_service = MagicMock()
        service.capture_buffer_manager = MagicMock()
        service.execute_lock = MagicMock()
        service.execute_lock.__enter__ = MagicMock(return_value=None)
        service.execute_lock.__exit__ = MagicMock(return_value=None)
        service._initialize()
    return service


@pytest.fixture(autouse=True)
def clean_capture_service():
    CaptureService.clear_instance()  # type: ignore
    yield
    CaptureService.clear_instance()  # type: ignore


@pytest.fixture(autouse=True)
def disable_file_logging():
    logger = logging.getLogger(constants.LOGGER_NAME)
    file_handlers = [
        h for h in logger.handlers
        if isinstance(h, logging.handlers.TimedRotatingFileHandler)
        or isinstance(h, logging.StreamHandler)
    ]
    for handler in file_handlers:
        logger.removeHandler(handler)
    yield
    for handler in file_handlers:
        logger.addHandler(handler)


def test_get_capture_plugins_success(capture_service):
    mock_metadata = [MagicMock(), MagicMock()]
    capture_service.plugin_management.get_plugins_metadata_from_type.return_value = mock_metadata

    with patch("mo.modules.capture.services.capture_service.PluginRes") as mock_plugin_res:
        result = capture_service.get_capture_plugins()

        assert len(result) == 2
        assert mock_plugin_res.from_plugin_metadata.call_count == 2
        capture_service.plugin_management.get_plugins_metadata_from_type.assert_called_once()


@pytest.mark.asyncio
async def test_start_capture_success(capture_service):
    project_name = "TestProject"
    participant_code = "P01"
    mock_session = MagicMock(spec=SessionRes)
    mock_session.location = "/path/to/session"

    capture_service.load_processes = AsyncMock(return_value=MagicMock())
    capture_service.running_processes = {"plugin1": MagicMock()}
    capture_service.processes_instances = {"plugin1": ["config1"]}
    capture_service._get_capture_configs = MagicMock(return_value=[])
    capture_service.session_service.create_session.return_value = mock_session
    capture_service.exec_prepare_callback = AsyncMock()
    capture_service.exec_start_callback = AsyncMock()
    capture_service.capture_buffer_manager.clear_paused_intervals = MagicMock()
    capture_service.capture_buffer_manager.start = MagicMock()
    capture_service.started = False

    with patch("mo.modules.capture.services.capture_service.time.monotonic", return_value=1000.0), \
            patch("mo.modules.capture.services.capture_service.datetime"), \
            patch("mo.modules.capture.services.capture_service.translate", return_value="already started"):
        await capture_service.start_capture(project_name, participant_code)

    assert capture_service.started is True
    assert capture_service.paused is False
    assert capture_service.project_name == project_name
    assert capture_service.participant_code == participant_code
    capture_service.session_service.create_session.assert_called_once()
    capture_service.exec_prepare_callback.assert_awaited_with(
        mock_session.location)
    capture_service.exec_start_callback.assert_awaited()
    capture_service.capture_buffer_manager.start.assert_called_once()


@pytest.mark.asyncio
async def test_start_capture_already_started_raises_exception(capture_service):
    capture_service.started = True
    with patch("mo.modules.capture.services.capture_service.translate", return_value="already started"):
        with pytest.raises(BadRequestException, match="already started"):
            await capture_service.start_capture("proj", "p1")


@pytest.mark.asyncio
async def test_start_capture_no_processes_loaded_raises_exception(capture_service):
    capture_service.load_processes = AsyncMock()
    capture_service.running_processes = {}
    capture_service.started = False
    with patch("mo.modules.capture.services.capture_service.translate", return_value="no loaded"):
        with pytest.raises(BadRequestException, match="no loaded"):
            await capture_service.start_capture("proj", "p1")


@pytest.mark.asyncio
async def test_stop_capture_success(capture_service):
    capture_service.started = True
    capture_service.project_name = "TestProject"
    capture_service.participant_code = "P01"
    capture_service.session = MagicMock(spec=SessionRes)
    capture_service.session.session_id = "s1"
    capture_service.capture_buffer_manager.add_paused_interval = MagicMock()
    capture_service.capture_buffer_manager.get_paused_intervals = MagicMock(
        return_value=[(1, 2), (3, 4)])
    capture_service.capture_buffer_manager.stop = MagicMock()
    capture_service.exec_stop_callback = AsyncMock(return_value={})
    capture_service.unload_running_processes = AsyncMock()
    capture_service._initialize = MagicMock()
    capture_service.paused_time = 0.0
    capture_service.start_ts = 1000.0

    with patch("mo.modules.capture.services.capture_service.time.monotonic", return_value=1100.0), \
            patch("mo.modules.capture.services.capture_service.datetime"), \
            patch("mo.modules.capture.services.capture_service.SessionPut") as mock_session_put, \
            patch("mo.modules.capture.services.capture_service.translate", return_value="not started"):
        mock_session_put.from_session_res.return_value = MagicMock(
            spec=SessionPut)
        await capture_service.stop_capture()

    assert capture_service.session_service.update_session.called
    capture_service.capture_buffer_manager.stop.assert_called_with(timeout=2)
    capture_service.unload_running_processes.assert_awaited()
    capture_service._initialize.assert_called_once()


@pytest.mark.asyncio
async def test_stop_capture_not_started_raises_exception(capture_service):
    capture_service.started = False
    with patch("mo.modules.capture.services.capture_service.translate", return_value="not started"):
        with pytest.raises(BadRequestException, match="not started"):
            await capture_service.stop_capture()


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_pause_and_resume_capture_success(asyncio_mock, capture_service):
    capture_service.started = True
    capture_service.paused = False
    mock_process = MagicMock()
    mock_process.execute_callback_on_all_instances = MagicMock()
    capture_service.running_processes = {"p1": mock_process}
    capture_service.capture_buffer_manager.pause = MagicMock()
    capture_service.capture_buffer_manager.resume = MagicMock()
    capture_service.paused_time = 0.0

    mock_lock = MagicMock()
    mock_lock.__enter__.return_value = None
    mock_lock.__exit__.return_value = None
    capture_service.execute_lock = mock_lock

    with patch("mo.modules.capture.services.capture_service.time.monotonic", side_effect=[100.0, 110.0]), \
            patch("mo.modules.capture.services.capture_service.translate", return_value="not started or already paused"):
        await capture_service.pause_capture()
        assert capture_service.paused is True
        assert capture_service.paused_ts == 100.0
        capture_service.capture_buffer_manager.pause.assert_called_with(100.0)
        mock_process.execute_callback_on_all_instances.assert_called_once()

        capture_service.paused = True
        capture_service.paused_ts = 100.0
        await capture_service.resume_capture()
        assert capture_service.paused is False
        assert capture_service.paused_time == 10.0
        capture_service.capture_buffer_manager.resume.assert_called_with(110.0)
        assert mock_process.execute_callback_on_all_instances.call_count == 2


@patch("threading.Thread")
def test_on_capture_data_callback_first_time(mock_thread, capture_service):
    capture_service.project_name = "proj"
    capture_service.participant_code = "p1"
    capture_service.session = MagicMock(spec=SessionRes, session_id="s1")
    capture_service.first_timestamp = {}
    mock_data = MagicMock(
        spec=PluginData, config_id="config1", timestamp=1234.5)

    capture_service.on_capture_data_callback(mock_data)

    assert capture_service.first_timestamp["config1"] == 1234.5
    mock_thread.assert_called_once()
    mock_thread.return_value.start.assert_called_once()


def test_get_capture_plugin_file_name_success(capture_service):
    mock_process = MagicMock()
    mock_process.execute_callback_on_instance.return_value = "csv"
    capture_service.running_processes["plugin1"] = mock_process

    with patch("mo.modules.capture.services.capture_service.FileManagement") as mock_fm:
        mock_fm.normalize_file_name.return_value = "my_config"
        file_name = capture_service.get_capture_plugin_file_name(
            "plugin1", "My Config")

    assert file_name == "my_config.csv"
    mock_process.execute_callback_on_instance.assert_called_once()


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_exec_prepare_callback_success(asyncio_mock, capture_service):
    mock_process = MagicMock()
    mock_process.execute_callback_on_instance = MagicMock()
    capture_service.running_processes = {"plugin1": mock_process}
    capture_service.processes_instances = {"plugin1": ["config1"]}
    capture_service._format_data_file_name = MagicMock(
        return_value="config1_formatted")

    await capture_service.exec_prepare_callback("/path/to/session")

    mock_process.execute_callback_on_instance.assert_called_with(
        "config1",
        prepare_callback,
        {"session_path": "/path/to/session", "file_name": "config1_formatted"},
    )


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_exec_start_callback_success(asyncio_mock, capture_service):
    mock_process = MagicMock()
    mock_process.execute_callback_on_instance = MagicMock()
    capture_service.running_processes = {"plugin1": mock_process}
    capture_service.processes_instances = {"plugin1": ["config1"]}
    capture_service.start_ts = 12345.0

    await capture_service.exec_start_callback()

    mock_process.execute_callback_on_instance.assert_called_with(
        "config1", start_callback, {
            "config_id": "config1", "start_ts": 12345.0}
    )


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_stop_capture_raises_on_process_stop_failure(asyncio_mock, capture_service):
    capture_service.started = True
    mock_session = MagicMock(spec=SessionRes)
    mock_session.session_id = "s1"
    mock_session.start_timestamp = 1000.0
    mock_session.end_timestamp = 1100.0
    mock_session.paused_time = 5.0
    mock_session.started_at = datetime.now()
    mock_session.ended_at = datetime.now()
    mock_session.duration = 95.0
    mock_session.paused_intervals = []
    mock_session.capture_sources = []
    capture_service.session = mock_session

    capture_service.capture_buffer_manager.add_paused_interval = MagicMock()
    capture_service.capture_buffer_manager.get_paused_intervals = MagicMock(
        return_value=[])
    capture_service.capture_buffer_manager.stop = MagicMock()
    capture_service.exec_stop_callback = AsyncMock(
        return_value={"p1": Exception("fail")})
    capture_service.unload_running_processes = AsyncMock()
    capture_service._initialize = MagicMock()
    capture_service.paused_time = 0.0
    capture_service.start_ts = 1000.0

    with patch("mo.modules.capture.services.capture_service.time.monotonic", return_value=1100.0), \
            patch("mo.modules.capture.services.capture_service.datetime"), \
            patch("mo.modules.capture.services.capture_service.SessionPut") as mock_session_put, \
            patch("mo.modules.capture.services.capture_service.translate", return_value="Failed to stop"):
        mock_session_put.from_session_res.return_value = MagicMock(
            spec=SessionPut)
        with pytest.raises(BadRequestException, match="Failed to stop"):
            await capture_service.stop_capture()


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_pause_capture_invalid_state(asyncio_mock, capture_service):
    capture_service.started = False
    with patch("mo.modules.capture.services.capture_service.translate", return_value="not started or already paused"):
        with pytest.raises(BadRequestException, match="not started or already paused"):
            await capture_service.pause_capture()

    capture_service.started = True
    capture_service.paused = True
    with patch("mo.modules.capture.services.capture_service.translate", return_value="not started or already paused"):
        with pytest.raises(BadRequestException, match="not started or already paused"):
            await capture_service.pause_capture()


@pytest.mark.asyncio
async def test_pause_capture_handles_process_exception(capture_service, caplog):
    capture_service.started = True
    capture_service.paused = False

    mock_process = MagicMock()
    mock_process.execute_callback_on_all_instances = MagicMock(
        side_effect=RuntimeError("Pause Failed"))
    capture_service.running_processes = {"p1": mock_process}
    capture_service.capture_buffer_manager.pause = MagicMock()

    mock_lock = MagicMock()
    mock_lock.__enter__.return_value = None
    mock_lock.__exit__.return_value = None
    capture_service.execute_lock = mock_lock

    with patch("mo.modules.capture.services.capture_service.time.monotonic", return_value=100.0), \
            patch("mo.modules.capture.services.capture_service.translate", return_value="not started or already paused"):
        with caplog.at_level(logging.ERROR):
            await capture_service.pause_capture()

    assert capture_service.paused is True
    assert any(
        "Error executing pause callback for process" in message for message in caplog.messages
    )


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_resume_capture_invalid_state(asyncio_mock, capture_service):
    capture_service.started = False
    with patch("mo.modules.capture.services.capture_service.translate", return_value="not started or not paused"):
        with pytest.raises(BadRequestException, match="not started or not paused"):
            await capture_service.resume_capture()

    capture_service.started = True
    capture_service.paused = False
    with patch("mo.modules.capture.services.capture_service.translate", return_value="not started or not paused"):
        with pytest.raises(BadRequestException, match="not started or not paused"):
            await capture_service.resume_capture()


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_resume_capture_handles_process_exception(asyncio_mock, capture_service, caplog):
    capture_service.started = True
    capture_service.paused = True
    mock_process = MagicMock()
    mock_process.execute_callback_on_all_instances = MagicMock(
        side_effect=RuntimeError("Resume Failed"))
    capture_service.running_processes = {"p1": mock_process}
    capture_service.capture_buffer_manager.resume = MagicMock()
    capture_service.paused_ts = 100.0
    capture_service.paused_time = 0.0

    mock_lock = MagicMock()
    mock_lock.__enter__.return_value = None
    mock_lock.__exit__.return_value = None
    capture_service.execute_lock = mock_lock

    with patch("mo.modules.capture.services.capture_service.time.monotonic", return_value=110.0), \
            patch("mo.modules.capture.services.capture_service.translate", return_value="not started or not paused"):
        with caplog.at_level(logging.ERROR):
            await capture_service.resume_capture()

    assert capture_service.paused is False
    assert any(
        "Error executing resume callback for process" in message for message in caplog.messages
    )


def test_get_capture_plugin_file_name_process_none(capture_service):
    capture_service.running_processes = {}
    with patch("mo.modules.capture.services.capture_service.translate", return_value="no running process"):
        with pytest.raises(BadRequestException, match="no running process"):
            capture_service.get_capture_plugin_file_name("p1", "c1")


def test_get_capture_plugin_file_name_no_extension(capture_service):
    mock_process = MagicMock()
    mock_process.execute_callback_on_instance.return_value = None
    capture_service.running_processes["plugin1"] = mock_process

    with patch.object(capture_service, "_format_data_file_name", return_value="my_config"):
        file_name = capture_service.get_capture_plugin_file_name(
            "plugin1", "My Config")

    assert file_name == "my_config"


def test_get_capture_configs_success(capture_service):
    mock_config = MagicMock()
    mock_config.plugin_id = "p1"
    mock_config.name = "c1"
    mock_config.id = "c1"
    mock_config.settings = {"k": "v"}
    mock_config.plugin_metadata.name = "Plugin Name"
    mock_config.plugin_metadata.version = MagicMock(__str__=lambda self: "1.0")

    capture_service.config_service.get_all_configs_loaded.return_value = [
        mock_config]
    capture_service.get_capture_plugin_file_name = MagicMock(
        return_value="file_name.ext")

    result = capture_service._get_capture_configs("proj")

    assert len(result) == 1
    assert isinstance(result[0], CaptureConfigDetailsPost)
    assert result[0].config_name == "c1"


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_load_processes_success(asyncio_mock, capture_service):
    mock_config = MagicMock()
    mock_config.plugin_id = "plugin1"
    mock_config.name = "config1"
    mock_config.id = "config1"
    mock_config.settings = {}
    mock_process = MagicMock(spec=PluginWorkerProcess)
    mock_process.add_plugin_instance = MagicMock(return_value=None)

    capture_service.config_service.get_all_configs_loaded.return_value = [
        mock_config]
    capture_service.plugin_management.get_active_plugin_process = MagicMock(
        return_value=mock_process)

    with patch("multiprocessing.Queue", return_value=MagicMock()):
        await capture_service.load_processes("proj")

    assert "plugin1" in capture_service.running_processes
    assert "config1" in capture_service.processes_instances["plugin1"]
    mock_process.add_plugin_instance.assert_called_once()


@pytest.mark.asyncio
@patch("mo.modules.capture.services.capture_service.asyncio.to_thread", side_effect=lambda func, *args, **kwargs: func(*args, **kwargs))
async def test_unload_running_processes_success(asyncio_mock, capture_service):
    mock_process1 = MagicMock(spec=PluginWorkerProcess)
    mock_process2 = MagicMock(spec=PluginWorkerProcess)
    mock_process1.stop = MagicMock()
    mock_process2.stop = MagicMock()
    capture_service.running_processes = {
        "p1": mock_process1, "p2": mock_process2}

    await capture_service.unload_running_processes()

    mock_process1.stop.assert_called_with(timeout=10, force=True)
    mock_process2.stop.assert_called_with(timeout=10, force=True)


def test_is_capturing_and_is_paused_state(capture_service):
    capture_service.started = True
    capture_service.paused = False
    assert capture_service.is_capturing() is True
    assert capture_service.is_paused() is False

    capture_service.paused = True
    assert capture_service.is_capturing() is True
    assert capture_service.is_paused() is True

    capture_service.started = False
    capture_service.paused = False
    assert capture_service.is_capturing() is False
    assert capture_service.is_paused() is False


def test_get_status_returns_correct_state(capture_service):
    capture_service.started = True
    capture_service.paused = True
    capture_service.project_name = "MyProject"
    capture_service.participant_code = "P99"

    with patch(
        "mo.modules.capture.services.capture_service.CaptureStatusResponse"
    ) as mock_response:
        capture_service.get_status()
        mock_response.assert_called_with(
            started=True, paused=True, project_name="MyProject", participant_code="P99"
        )


@pytest.mark.asyncio
async def test_exec_prepare_callback_handles_exception(capture_service, caplog):
    mock_process = MagicMock()
    mock_process.execute_callback_on_instance = MagicMock(
        side_effect=RuntimeError("Prepare Failed"))
    mock_process.remove_plugin_instance = MagicMock()
    capture_service.running_processes = {"plugin1": mock_process}
    capture_service.processes_instances = {"plugin1": ["config1"]}
    capture_service._format_data_file_name = MagicMock(return_value="any_file")

    await capture_service.exec_prepare_callback("/path/to/session")

    assert not capture_service.processes_instances["plugin1"]
    mock_process.remove_plugin_instance.assert_called_with("config1")
    assert any(
        "Error executing prepare callback for config1 in process plugin1" in message
        for message in caplog.messages
    )


@pytest.mark.asyncio
async def test_exec_start_callback_handles_exception(capture_service, caplog):
    mock_process = MagicMock()
    mock_process.execute_callback_on_instance = MagicMock(
        side_effect=RuntimeError("Start Failed"))
    capture_service.running_processes = {"plugin1": mock_process}
    capture_service.processes_instances = {"plugin1": ["config1"]}
    capture_service.start_ts = 12345.0

    await capture_service.exec_start_callback()

    mock_process.execute_callback_on_instance.assert_called_once()
    assert any(
        "Error executing start callback for config1 in process plugin1" in message
        for message in caplog.messages
    )


@pytest.mark.asyncio
async def test_load_processes_skips_none_plugin_process(capture_service):
    mock_config = MagicMock()
    mock_config.plugin_id = "p1"
    mock_config.id = "c1"
    mock_config.name = "n"
    mock_config.settings = {}

    capture_service.config_service.get_all_configs_loaded.return_value = [
        mock_config]
    capture_service.plugin_management.get_active_plugin_process = MagicMock(
        return_value=None)

    with patch("multiprocessing.Queue", return_value=MagicMock()):
        await capture_service.load_processes("proj")

    assert not capture_service.running_processes
    assert not capture_service.processes_instances
