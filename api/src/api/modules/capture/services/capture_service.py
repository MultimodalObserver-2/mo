import threading
from datetime import datetime
from typing import Any
from api.core.api.schemas.plugin import PluginRes
from api.core.file_management.file_management import FileManagement
from api.core.plugin.plugin import Plugin
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.plugin_worker_process import PluginWorkerProcess
from api.core.plugin.settings import Settings
from api.core.utils.http_exceptions import BadRequestException
from api.core.utils.singleton import singleton
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.capture.services.setting_service import CaptureSettingService
from api.modules.organization.services.participant_service import ParticipantService
from api.modules.organization.services.project_service import ProjectService

def start_callback(instance: Plugin, extra_args: dict[str, Any] | None):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    threading.Thread(
        target=instance.start,
        args=(extra_args["session_path"], extra_args["file_name"]),
    ).start()

def stop_callback(instance: Plugin, extra_args: dict[str, Any] | None):
    if isinstance(instance, CapturePlugin):
        instance.stop()

@singleton
class CaptureService:
    def __init__(self):
        self.project_service = ProjectService()
        self.participant_service = ParticipantService()
        self.plugin_management = PluginManagement()
        self.file_management = FileManagement()
        self.setting_service = CaptureSettingService()
        self.started = False
        self.running_processes = {} # type: dict[str, PluginWorkerProcess]
        self.processes_instances = {} # type: dict[str, list[str]]

    def _get_participant_location(self, project_name: str, participant_code: str):
        participant = self.participant_service.get_participant(
            project_name, participant_code)
        return participant.location

    def _get_session_dir_name(self):
        datetime_now = datetime.now().strftime("%Y-%m-%d_%H.%M.%S")
        return f"session[{datetime_now}]"

    def _format_data_file_name(self, file_name: str) -> str:
        file_name = file_name.lower()
        file_name = file_name.replace(" ", "_")
        file_name = self.file_management.normalize_file_name(file_name)
        return file_name

    def get_capture_plugins(self) -> list[PluginRes]:
        plugins_metadata = self.plugin_management.get_plugins_metadata_from_type(CapturePlugin)
        plugins_res = [PluginRes.from_plugin_metadata(
            plugin_metadata) for plugin_metadata in plugins_metadata]
        return plugins_res

    def start_capture(self, project_name: str, participant_code: str):
        if self.started:
            raise BadRequestException("Capture is already started.")
        self.running_plugins = self.load_processes(project_name)
        participant_location = self._get_participant_location(
            project_name, participant_code)
        session_dir_name = self._get_session_dir_name()
        session_path = self.file_management.create_directory(
            session_dir_name, participant_location)
        self.started = True
        for key, process in self.running_processes.items():
            for setting_name in self.processes_instances[key]:
                file_name = self._format_data_file_name(setting_name)
                extra_args = {
                    "session_path": session_path,
                    "file_name": file_name
                }
                process.execute_callback_on_instance(setting_name, start_callback, extra_args)
        
    def stop_capture(self):
        if not self.started:
            raise BadRequestException("Capture is not started.")

        for process in self.running_processes.values():
            process.execute_callback_on_all_instances(stop_callback)
        self.unload_running_processes()
        self.started = False

    def load_processes(self, project_name: str):
        settings_list = self.setting_service.get_all_capture_settings_loaded(
            project_name)
        self.running_processes = {}
        for settings in settings_list:
            if self.running_processes.get(settings.plugin_id) is None:
                plugin_process = self.plugin_management.get_active_plugin_process(
                    settings.plugin_id)
                if plugin_process is None:
                    continue
                self.running_processes[settings.plugin_id] = plugin_process
                self.processes_instances[settings.plugin_id] = []
            self.running_processes[settings.plugin_id].add_plugin_instance(
                settings.name, Settings(settings.settings))
            self.processes_instances[settings.plugin_id].append(settings.name)

    def unload_running_processes(self):
        for process in self.running_processes.values():
            process.terminate()

    def is_capturing(self) -> bool:
        return self.started
