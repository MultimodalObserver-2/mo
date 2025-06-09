import multiprocessing
import threading
from datetime import datetime
import time
from mo.core.api.schemas.plugin import PluginRes
from mo.core.file_management.file_management import FileManagement
from mo.core.plugin.manager import PluginManager
from mo.core.plugin.worker_process import PluginWorkerProcess
from mo.core.plugin.models.settings import Settings
from mo.core.utils.http_exceptions import BadRequestException
from mo.core.utils.singleton import singleton
from mo.modules.capture.plugins.capture_plugin import CapturePlugin
from mo.modules.capture.schemas.capture import CaptureStatusResponse, PluginData
from mo.modules.capture.schemas.session import CaptureConfigDetailsPost, SessionPost, SessionPut, SessionRes
from mo.modules.capture.services.capture_buffer_manager import CaptureBufferManager
from mo.modules.capture.services.capture_plugin_callbacks import get_file_extension_callback, pause_callback, prepare_callback, resume_callback, start_callback, stop_callback
from mo.modules.capture.services.session_service import SessionService
from mo.modules.capture.services.config_service import CaptureConfigService


@singleton
class CaptureService:
    FLUSH_INTERVAL = 1.0  # seconds
    MONITOR_INTERVAL = 0.5  # seconds
    MEMORY_LIMIT = 75  # Memory usage limit in percentage
    SWAP_MEMORY_LIMIT = 25  # Swap memory usage limit in percentage

    def __init__(self):
        self.session_service = SessionService()
        self.plugin_management = PluginManager()
        self.config_service = CaptureConfigService()
        # Lock to ensure thread-safe execution of callbacks
        self._initialize()
        self.execute_lock = threading.Lock()
        self.capture_buffer_manager = CaptureBufferManager(
            execution_lock=self.execute_lock,
            flush_interval=self.FLUSH_INTERVAL,
            monitor_interval=self.MONITOR_INTERVAL,
            memory_limit=self.MEMORY_LIMIT,
            swap_memory_limit=self.SWAP_MEMORY_LIMIT,
            on_capture_data=self.on_capture_data_callback
        )

    def _initialize(self):
        self.running_processes = {}  # type: dict[str, PluginWorkerProcess]
        self.processes_instances = {}  # type: dict[str, list[str]]
        self.started = False
        self.paused = False
        self.project_name = None  # type: str | None
        self.participant_code = None  # type: str | None
        self.session = None  # type: SessionRes | None
        self.start_ts = 0.0
        self.paused_ts = 0.0
        self.paused_time = 0.0
        self.first_timestamp = {}  # type: dict[str, float]

    def _format_data_file_name(self, file_name: str) -> str:
        file_name = file_name.lower()
        file_name = file_name.replace(" ", "_")
        file_name = FileManagement.normalize_file_name(file_name)
        return file_name

    def get_capture_plugins(self) -> list[PluginRes]:
        plugins_metadata = self.plugin_management.get_plugins_metadata_from_type(
            CapturePlugin)
        plugins_res = [PluginRes.from_plugin_metadata(
            plugin_metadata) for plugin_metadata in plugins_metadata]
        return plugins_res

    def exec_prepare_callback(self, session_path: str):
        valid_processes_instances = self.processes_instances.copy()
        for key, process in self.running_processes.items():
            for config_name in self.processes_instances[key]:
                file_name = self._format_data_file_name(config_name)
                extra_args = {
                    "session_path": session_path,
                    "file_name": file_name
                }
                try:
                    process.execute_callback_on_instance(
                        config_name, prepare_callback, extra_args)
                except Exception as e:
                    print(
                        f"Error executing prepare callback for {config_name} in process {key}: {e}")
                    valid_processes_instances[key].remove(config_name)
                    process.remove_plugin_instance(config_name)
        self.processes_instances = valid_processes_instances

    def exec_start_callback(self):
        for key, process in self.running_processes.items():
            for config_name in self.processes_instances[key]:
                extra_args = {
                    "config_name": config_name,
                    "start_ts": self.start_ts,
                }
                try:
                    process.execute_callback_on_instance(
                        config_name, start_callback, extra_args)
                except Exception as e:
                    print(
                        f"Error executing start callback for {config_name} in process {key}: {e}")

    def start_capture(self, project_name: str, participant_code: str):
        if self.started:
            raise BadRequestException("Capture is already started.")
        processes_queue = self.load_processes(
            project_name)
        if len(self.running_processes) == 0:
            raise BadRequestException(
                "No capture configurations loaded for the project")
        self.start_ts = time.monotonic()
        self.project_name = project_name
        self.participant_code = participant_code
        self.session = self.session_service.create_session(
            project_name, participant_code, SessionPost(
                start_timestamp=self.start_ts,
                started_at=datetime.now(),
                capture_sources=self._get_capture_configs(project_name)
            )
        )
        self.exec_prepare_callback(self.session.location)
        self.exec_start_callback()
        self.started = True
        self.paused = False
        self.capture_buffer_manager.clear_paused_intervals()
        buffer_tuples = []
        for key, configs in self.processes_instances.items():
            for config_name in configs:
                buffer_tuples.append((key, config_name))
        self.capture_buffer_manager.start(
            buffer_tuples, processes_queue, self.running_processes)

    def on_capture_data_callback(self, data: PluginData):
        if data.config_name not in self.first_timestamp and self.session is not None:
            self.first_timestamp[data.config_name] = data.timestamp
            threading.Thread(
                target=self.session_service.add_capture_source_setting_start_timestamp,
                args=(self.project_name or "", self.participant_code or "",
                      self.session.session_id, data.config_name, data.timestamp),
            ).start()

    def stop_capture(self):
        if not self.started:
            raise BadRequestException("Capture is not started.")
        exceptions = {}
        self.started = False
        self.paused = False
        stop_ts = time.monotonic()
        self.capture_buffer_manager.add_paused_interval(stop_ts, None)
        stop_datetime = datetime.now()
        for key, process in self.running_processes.items():
            try:
                process.execute_callback_on_all_instances(
                    stop_callback, {"stop_ts": stop_ts})
            except Exception as e:
                exceptions[key] = e
        if self.session and self.project_name and self.participant_code:
            duration = stop_ts - self.start_ts - self.paused_time
            self.session.duration = duration
            self.session.end_timestamp = stop_ts
            self.session.ended_at = stop_datetime
            self.session.paused_time = self.paused_time
            session_put = SessionPut.from_session_res(self.session)
            session_put.capture_sources = []
            session_put.paused_intervals = self.capture_buffer_manager.get_paused_intervals()
            # Remove the last interval which is stop_ts, None
            session_put.paused_intervals.pop()
            self.session_service.update_session(
                self.project_name, self.participant_code, self.session.session_id, session_put)

        self.capture_buffer_manager.stop(timeout=2)
        self.unload_running_processes()
        self._initialize()
        if len(exceptions) > 0:
            raise BadRequestException(
                "Failed to stop safely some processes, some data may be lost.")

    def pause_capture(self):
        if not self.started or self.paused:
            raise BadRequestException(
                "Capture is not started or already paused.")
        self.paused_ts = time.monotonic()
        self.capture_buffer_manager.add_paused_interval(
            self.paused_ts, None)  # None indicates not resumed yet
        with self.execute_lock:
            for process in self.running_processes.values():
                try:
                    process.execute_callback_on_all_instances(
                        pause_callback, {"pause_ts": self.paused_ts}, need_response=False)
                except Exception as e:
                    print(f"Error pausing process: {e}")

        self.paused = True

    def resume_capture(self):
        if not self.started or not self.paused:
            raise BadRequestException("Capture is not started or not paused.")
        resume_ts = time.monotonic()
        self.capture_buffer_manager.patch_last_paused_interval(
            None, resume_ts)  # Update the last interval to resume time
        args = {
            "resume_ts": resume_ts,
        }
        with self.execute_lock:
            for process in self.running_processes.values():
                try:
                    process.execute_callback_on_all_instances(
                        resume_callback, args, need_response=False)
                except Exception as e:
                    print(f"Error resuming process: {e}")

        self.paused_time += resume_ts - self.paused_ts
        self.paused_ts = 0.0
        self.paused = False

    def get_capture_plugin_file_name(self, plugin_id: str, config_name: str) -> str:
        process = self.running_processes.get(plugin_id)
        if process is None:
            raise BadRequestException(
                f"No running process found for plugin {plugin_id}.")
        file_extension = process.execute_callback_on_instance(
            config_name, get_file_extension_callback)
        file_name = self._format_data_file_name(config_name)
        if not file_extension:
            return file_name
        file_extension = file_extension.lstrip('.').lower()
        return f"{file_name}.{file_extension}"

    def _get_capture_configs(self, project_name: str) -> list[CaptureConfigDetailsPost]:
        configs = self.config_service.get_all_configs_loaded(
            project_name)
        capture_configs = []
        for config in configs:
            file_name = self.get_capture_plugin_file_name(
                config.plugin_id, config.name)
            file_extension = file_name.split(
                '.')[-1] if '.' in file_name else ''
            capture_configs.append(
                CaptureConfigDetailsPost(
                    config_name=config.name,
                    plugin_id=config.plugin_id,
                    plugin_name=config.plugin_metadata.name,
                    plugin_version=str(config.plugin_metadata.version),
                    settings=config.settings,
                    file_extension=file_extension,
                    file_name=self.get_capture_plugin_file_name(
                        config.plugin_id, config.name)
                )
            )
        return capture_configs

    def load_processes(self, project_name: str) -> multiprocessing.Queue:
        configs = self.config_service.get_all_configs_loaded(
            project_name)
        processes_queue = multiprocessing.Queue()
        self.running_processes = {}
        for config in configs:
            if self.running_processes.get(config.plugin_id) is None:
                plugin_process = self.plugin_management.get_active_plugin_process(
                    config.plugin_id, processes_queue)
                if plugin_process is None:
                    continue
                self.running_processes[config.plugin_id] = plugin_process
                self.processes_instances[config.plugin_id] = []
            self.running_processes[config.plugin_id].add_plugin_instance(
                config.name, Settings(config.settings))
            self.processes_instances[config.plugin_id].append(config.name)
        return processes_queue

    def unload_running_processes(self):
        for process in self.running_processes.values():
            process.stop(timeout=10, force=True)

    def is_capturing(self) -> bool:
        return self.started

    def is_paused(self) -> bool:
        return self.paused

    def get_status(self) -> CaptureStatusResponse:
        return CaptureStatusResponse(
            started=self.started,
            paused=self.paused,
            project_name=self.project_name,
            participant_code=self.participant_code
        )
