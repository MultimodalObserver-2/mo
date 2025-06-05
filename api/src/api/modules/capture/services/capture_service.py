from collections import defaultdict
import multiprocessing
import queue
import threading
from datetime import datetime
import time
from typing import Any, Optional
from api.core.api.schemas.plugin import PluginRes
from api.core.file_management.file_management import FileManagement
from api.core.plugin.plugin import Plugin
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.plugin_worker_process import PluginProcessMetadata, PluginWorkerProcess
from api.core.plugin.settings import Settings
from api.core.utils.buffer import ListBuffer
from api.core.utils.http_exceptions import BadRequestException
from api.core.utils.singleton import singleton
from api.modules.capture.plugins.capture_plugin import CaptureData, CapturePlugin
from api.modules.capture.schemas.capture import CaptureStatusResponse
from api.modules.capture.schemas.session import CaptureSettingDetailsPost, SessionPost, SessionRes
from api.modules.capture.services.session_service import SessionService
from api.modules.capture.services.setting_service import CaptureSettingService
import psutil
from pydantic import BaseModel


class PluginData(BaseModel):
    plugin_id: str
    setting_name: str
    timestamp: float
    data: Any


def prepare_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    session_path = extra_args.get("session_path", "")
    file_name = extra_args.get("file_name", "")
    instance.prepare(session_path, file_name)


def start_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], process_queue: Optional[multiprocessing.Queue], process_metadata: PluginProcessMetadata, *_):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return

    setting_name = extra_args.get("setting_name", "")

    def on_data_callback(data: CaptureData):
        try:
            if process_queue is not None:
                process_queue.put(PluginData(
                    plugin_id=process_metadata.metadata.get_final_id(),
                    setting_name=setting_name,
                    timestamp=data.timestamp,
                    data=data.data
                ), block=False)
        except Exception as e:
            print(f"Error in on_data_callback for {setting_name}: {e}")

    thread = threading.Thread(
        target=instance.start,
        args=(extra_args["start_ts"], time.monotonic, on_data_callback),
        daemon=True
    )
    thread.start()


def stop_callback(instance: Plugin, *_):
    if isinstance(instance, CapturePlugin):
        instance.stop()


def pause_callback(instance: Plugin, *_):
    if isinstance(instance, CapturePlugin):
        instance.pause()


def resume_callback(instance: Plugin, *_):
    if isinstance(instance, CapturePlugin):
        instance.resume()


def get_file_extension_callback(instance: Plugin, *_):
    if isinstance(instance, CapturePlugin):
        return instance.get_file_extension()
    return ""


def save_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    data = extra_args.get("data", [])
    end_of_data = extra_args.get("end_of_data", False)
    instance.save(data, end_of_data)


@singleton
class CaptureService:
    def __init__(self):
        self.session_service = SessionService()
        self.plugin_management = PluginManagement()
        self.setting_service = CaptureSettingService()
        self.started = False
        self.paused = False
        self.running_processes = {}  # type: dict[str, PluginWorkerProcess]
        self.processes_instances = {}  # type: dict[str, list[str]]
        self.project_name = None  # type: str | None
        self.participant_code = None  # type: str | None
        self.session = None  # type: SessionRes | None
        self.duration = 0.0
        self.processes_queue = None  # type: multiprocessing.Queue | None
        self.get_captured_data_thread = None  # type: threading.Thread | None
        self.flush_captured_data_thread = None  # type: threading.Thread | None
        self.stressed_monitor_thread = None  # type: threading.Thread | None
        self.execute_lock = threading.Lock() # Lock to ensure thread-safe execution of callbacks
        # type: dict[tuple[str, str], ListBuffer[CaptureData]]
        self.buffer = defaultdict(ListBuffer[CaptureData])

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

    def prepare_capture(self, session_path: str):
        for key, process in self.running_processes.items():
            for setting_name in self.processes_instances[key]:
                file_name = self._format_data_file_name(setting_name)
                extra_args = {
                    "session_path": session_path,
                    "file_name": file_name
                }
                try:
                    process.execute_callback_on_instance(
                        setting_name, prepare_callback, extra_args)
                except Exception as e:
                    print(
                        f"Error executing prepare callback for {setting_name} in process {key}: {e}")
                    process.terminate()

    def start_capture(self, project_name: str, participant_code: str):
        if self.started:
            raise BadRequestException("Capture is already started.")
        self.processes_queue = self.load_processes(
            project_name)
        start_ts = time.monotonic()
        self.project_name = project_name
        self.participant_code = participant_code
        self.session = self.session_service.create_session(
            project_name, participant_code, SessionPost(
                start_timestamp=start_ts,
                started_at=datetime.now(),
                capture_sources=self._get_capture_settings_data(project_name)
            )
        )
        self.prepare_capture(self.session.location)
        for key, process in self.running_processes.items():
            for setting_name in self.processes_instances[key]:
                extra_args = {
                    "setting_name": setting_name,
                    "start_ts": start_ts,
                }
                try:
                    process.execute_callback_on_instance(
                        setting_name, start_callback, extra_args)
                    self.buffer[(key, setting_name)
                                ] = ListBuffer[CaptureData]()
                except Exception as e:
                    print(
                        f"Error executing start callback for {setting_name} in process {key}: {e}")
        self.started = True
        self.paused = False
        self.get_captured_data_thread = threading.Thread(
            target=self.get_captured_data,
            args=(),
            daemon=True
        )
        self.get_captured_data_thread.start()
        flush_interval = 1.0  # seconds
        self.flush_captured_data_thread = threading.Thread(
            target=self.flush_captured_data_periodically,
            args=(flush_interval,)
        )
        self.flush_captured_data_thread.start()
        self.stressed_monitor_thread = threading.Thread(
            target=self.stressed_monitor,
            args=(),
            daemon=True
        )
        self.stressed_monitor_thread.start()

    def get_captured_data(self) -> None:
        first_timestamp = {}  # type: dict[str, float]
        while self.started:
            try:
                if self.processes_queue is None or self.session is None:
                    time.sleep(0.1)
                    continue
                data = self.processes_queue.get(timeout=0.1)
                if data is None or not isinstance(data, PluginData):
                    continue
                if data.setting_name not in first_timestamp:
                    first_timestamp[data.setting_name] = data.timestamp
                    threading.Thread(
                        target=self.session_service.add_capture_source_setting_start_timestamp,
                        args=(self.project_name or "", self.participant_code or "",
                              self.session.session_id, data.setting_name, data.timestamp),
                    ).start()
                self.buffer[(data.plugin_id, data.setting_name)].add(
                    CaptureData(
                        timestamp=data.timestamp,
                        data=data.data
                    )
                )
            except queue.Empty:
                pass
    
    def is_stressed(self) -> bool:
        mem = psutil.virtual_memory()
        cpu = psutil.cpu_percent(interval=1)
        swap = psutil.swap_memory()
        return (mem.percent > 75 or cpu > 80 or swap.percent > 20)

    def stressed_monitor(self):
        all_exceptions = []
        while self.started:
            try:
                if self.is_stressed():
                    print("System is stressed, flushing captured data.")
                    exceptions = self.flush_captured_data()
                    if exceptions:
                        all_exceptions.extend(exceptions.values())
                time.sleep(0.5)
            except Exception as e:
                print(f"Error during stress check and flush: {e}")
        return all_exceptions

    def flush_captured_data_periodically(self, interval: float = 1.0):
        all_exceptions = []
        while self.started:
            try:
                time.sleep(interval)
                exceptions = self.flush_captured_data()
                if exceptions:
                    all_exceptions.extend(exceptions.values())
            except Exception as e:
                print(f"Error flushing captured data: {e}")
                all_exceptions.append(e)
        return all_exceptions

    def flush_captured_data(self, end_of_data: bool = False) -> dict[tuple[str, str], Exception]:
        exceptions = {}
        for (plugin_id, setting_name), buffer in self.buffer.items():
            if not buffer:
                continue
            try:
                process = self.running_processes.get(plugin_id)
                if process is None:
                    continue

                with self.execute_lock:
                    extra_args = {
                        "data": buffer.get_all_and_clear(),
                        "end_of_data": end_of_data
                    }
                    process.execute_callback_on_instance(
                        setting_name, save_callback, extra_args)
            except Exception as e:
                exceptions[(plugin_id, setting_name)] = e
                print(
                    f"Error flushing data for {plugin_id} - {setting_name}: {e}")

        return exceptions

    def move_queue_to_buffer(self):
        if self.processes_queue is None:
            return
        while not self.processes_queue.empty():
            try:
                data = self.processes_queue.get_nowait()
                self.buffer[(data.plugin_id, data.setting_name)].add(
                    CaptureData(
                        timestamp=data.timestamp,
                        data=data.data
                    )
                )
                if self.processes_queue.empty():
                    # Await a bit to ensure no more data is coming
                    time.sleep(0.05)
            except queue.Empty:
                break
            except Exception as e:
                print(f"Error moving data to buffer: {e}")

    def stop_capture(self):
        if not self.started:
            raise BadRequestException("Capture is not started.")
        exceptions = {}
        self.started = False
        self.paused = False
        stop_ts = time.monotonic()
        for key, process in self.running_processes.items():
            try:
                process.execute_callback_on_all_instances(stop_callback)
            except Exception as e:
                exceptions[key] = e
        if self.session:
            self.session_service.add_end_timestamp(
                self.project_name or "", self.participant_code or "", self.session.session_id, stop_ts)
        if self.get_captured_data_thread is not None:
            self.get_captured_data_thread.join(timeout=5)
            self.get_captured_data_thread = None
        if self.flush_captured_data_thread is not None:
            self.flush_captured_data_thread.join(timeout=5)
            self.flush_captured_data_thread = None
        if self.stressed_monitor_thread is not None:
            self.stressed_monitor_thread.join(timeout=5)
            self.stressed_monitor_thread = None
        if self.processes_queue is not None:
            self.move_queue_to_buffer()
            self.processes_queue.close()
            self.processes_queue.join_thread()
        flush_exceptions = self.flush_captured_data(True)
        self.unload_running_processes()
        self.running_processes = {}
        self.processes_instances = {}
        self.processes_queue = None
        if len(exceptions) > 0 or len(flush_exceptions) > 0:
            raise BadRequestException(
                "Failed to stop safely some processes, some data may be lost.")

    def pause_capture(self):
        if not self.started or self.paused:
            raise BadRequestException(
                "Capture is not started or already paused.")
        try:
            with self.execute_lock:
                for process in self.running_processes.values():
                    process.execute_callback_on_all_instances(pause_callback)
        except Exception as e:
            print(f"Error pausing capture: {e}")
            raise BadRequestException("Failed to pause capture.")
        self.paused = True

    def resume_capture(self):
        if not self.started or not self.paused:
            raise BadRequestException("Capture is not started or not paused.")
        try:
            with self.execute_lock:
                for process in self.running_processes.values():
                    process.execute_callback_on_all_instances(resume_callback)
        except Exception as e:
            print(f"Error resuming capture: {e}")
            raise BadRequestException("Failed to resume capture.")
        self.paused = False

    def get_capture_plugin_file_name(self, plugin_id: str, setting_name: str) -> str:
        process = self.running_processes.get(plugin_id)
        if process is None:
            raise BadRequestException(
                f"No running process found for plugin {plugin_id}.")
        file_extension = process.execute_callback_on_instance(
            setting_name, get_file_extension_callback)
        file_name = self._format_data_file_name(setting_name)
        if not file_extension:
            return file_name
        file_extension = file_extension.lstrip('.').lower()
        return f"{file_name}.{file_extension}"

    def _get_capture_settings_data(self, project_name: str) -> list[CaptureSettingDetailsPost]:
        settings_list = self.setting_service.get_all_capture_settings_loaded(
            project_name)
        capture_settings_data = []
        for settings in settings_list:
            file_name = self.get_capture_plugin_file_name(
                settings.plugin_id, settings.name)
            file_extension = file_name.split(
                '.')[-1] if '.' in file_name else ''
            capture_settings_data.append(
                CaptureSettingDetailsPost(
                    setting_name=settings.name,
                    plugin_id=settings.plugin_id,
                    plugin_name=settings.plugin_metadata.name,
                    plugin_version=str(settings.plugin_metadata.version),
                    settings=settings.settings,
                    file_extension=file_extension,
                    file_name=self.get_capture_plugin_file_name(
                        settings.plugin_id, settings.name)
                )
            )
        return capture_settings_data

    def load_processes(self, project_name: str) -> multiprocessing.Queue:
        settings_list = self.setting_service.get_all_capture_settings_loaded(
            project_name)
        processes_queue = multiprocessing.Queue()
        self.running_processes = {}
        for settings in settings_list:
            if self.running_processes.get(settings.plugin_id) is None:
                plugin_process = self.plugin_management.get_active_plugin_process(
                    settings.plugin_id, processes_queue)
                if plugin_process is None:
                    continue
                self.running_processes[settings.plugin_id] = plugin_process
                self.processes_instances[settings.plugin_id] = []
            self.running_processes[settings.plugin_id].add_plugin_instance(
                settings.name, Settings(settings.settings))
            self.processes_instances[settings.plugin_id].append(settings.name)
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
