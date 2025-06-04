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
from api.core.plugin.plugin_worker_process import PluginWorkerProcess
from api.core.plugin.settings import Settings
from api.core.utils.http_exceptions import BadRequestException
from api.core.utils.singleton import singleton
from api.modules.capture.plugins.capture_plugin import CaptureData, CapturePlugin
from api.modules.capture.schemas.capture import CaptureStatusResponse
from api.modules.capture.schemas.session import CaptureSettingDetailsPost, SessionPost, SessionRes
from api.modules.capture.services.session_service import SessionService
from api.modules.capture.services.setting_service import CaptureSettingService
from pydantic import BaseModel


class PluginData(BaseModel):
    setting_name: str
    timestamp: float
    data: Any


def prepare_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], _):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    session_path = extra_args.get("session_path", "")
    file_name = extra_args.get("file_name", "")
    instance.prepare(session_path, file_name)


def start_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], process_queue: Optional[multiprocessing.Queue]):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return

    setting_name = extra_args.get("setting_name", "")

    def on_data_callback(data: CaptureData):
        try:
            if process_queue is not None:
                process_queue.put(PluginData(
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
        self.project_name = None # type: str | None
        self.participant_code = None # type: str | None
        self.session = None  # type: SessionRes | None

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
        processes_queue = self.running_plugins = self.load_processes(
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
                except Exception as e:
                    print(
                        f"Error executing start callback for {setting_name} in process {key}: {e}")
        self.started = True
        self.paused = False
        threading.Thread(
            target=self.get_captured_data,
            args=(processes_queue, self.session,),
            daemon=True
        ).start()

    def get_captured_data(self, data_queue: multiprocessing.Queue, session: SessionRes) -> None:
        first_timestamp = {}  # type: dict[str, float]
        while self.started:
            try:
                data = data_queue.get(timeout=0.1)
                if data is None or not isinstance(data, PluginData):
                    continue
                if data.setting_name not in first_timestamp:
                    first_timestamp[data.setting_name] = data.timestamp
                    threading.Thread(
                        target=self.session_service.add_capture_source_setting_start_timestamp,
                        args=(self.project_name or "", self.participant_code or "",
                              session.session_id, data.setting_name, data.timestamp),
                    ).start()
            except queue.Empty:
                pass

    def stop_capture(self):
        if not self.started:
            raise BadRequestException("Capture is not started.")
        exceptions = {}
        stop_ts = time.monotonic()
        for key, process in self.running_processes.items():
            try:
                process.execute_callback_on_all_instances(stop_callback)
            except Exception as e:
                exceptions[key] = e
        if self.session:
            self.session_service.add_end_timestamp(
                self.project_name or "", self.participant_code or "", self.session.session_id, stop_ts)
        self.unload_running_processes()
        self.started = False
        self.paused = False
        self.running_processes = {}
        self.processes_instances = {}
        if len(exceptions) > 0:
            raise BadRequestException(
                "Failed to stop safely some processes, some data may be lost.")

    def pause_capture(self):
        if not self.started or self.paused:
            raise BadRequestException(
                "Capture is not started or already paused.")
        try:
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
        file_extension = process.execute_callback_on_instance(setting_name, get_file_extension_callback)
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
            file_name = self.get_capture_plugin_file_name(settings.plugin_id, settings.name)
            file_extension = file_name.split('.')[-1] if '.' in file_name else ''
            capture_settings_data.append(
                CaptureSettingDetailsPost(
                    setting_name=settings.name,
                    plugin_id=settings.plugin_id,
                    plugin_name=settings.plugin_metadata.name,
                    plugin_version=str(settings.plugin_metadata.version),
                    settings=settings.settings,
                    file_extension=file_extension,
                    file_name=self.get_capture_plugin_file_name(settings.plugin_id, settings.name)
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
            process.stop()

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
