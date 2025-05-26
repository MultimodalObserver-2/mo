import threading
from datetime import datetime
from api.core.api.schemas.plugin import PluginRes
from api.core.file_management.file_management import FileManagement
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.settings import Settings
from api.core.utils.http_exceptions import BadRequestException
from api.core.utils.singleton import singleton
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.capture.services.setting_service import CaptureSettingService
from api.modules.organization.services.participant_service import ParticipantService
from api.modules.organization.services.project_service import ProjectService


@singleton
class CaptureService:
    def __init__(self):
        self.project_service = ProjectService()
        self.participant_service = ParticipantService()
        self.plugin_management = PluginManagement()
        self.file_management = FileManagement()
        self.setting_service = CaptureSettingService()
        self.started = False
        self.running_plugins = {}  # type: dict[str, CapturePlugin]

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
        plugins = self.plugin_management.get_plugins_from_type(CapturePlugin)
        plugins_metadata = [PluginRes.from_plugin_metadata(
            plugin.metadata) for plugin in plugins]
        return plugins_metadata

    def start_capture(self, project_name: str, participant_code: str):
        if self.started:
            raise BadRequestException("Capture is already started.")
        self.running_plugins = self.load_capture_plugins(project_name)
        participant_location = self._get_participant_location(
            project_name, participant_code)
        session_dir_name = self._get_session_dir_name()
        session_path = self.file_management.create_directory(
            session_dir_name, participant_location)
        self.started = True
        threads = []
        for key, plugin in self.running_plugins.items():
            file_name = self._format_data_file_name(key)
            thread = threading.Thread(
                target=plugin.start,
                args=(session_path, file_name),
            )
            thread.start()
            threads.append(thread)

    def stop_capture(self):
        if not self.started:
            raise BadRequestException("Capture is not started.")
        for plugin in self.running_plugins.values():
            plugin.stop()
        self.unload_running_plugins()
        self.started = False

    def load_capture_plugins(self, project_name: str) -> dict[str, CapturePlugin]:
        settings_list = self.setting_service.get_all_capture_settings_loaded(
            project_name)
        capture_plugins = {}
        for settings in settings_list:
            capture_plugin = self.load_capture_plugin(
                settings.plugin_name, Settings(settings.settings))
            if capture_plugin:
                capture_plugins[settings.name] = capture_plugin
        return capture_plugins

    def load_capture_plugin(self, plugin_name: str, settings: Settings) -> CapturePlugin | None:
        capture_plugin_cls = self.plugin_management.get_plugin(plugin_name)
        if not (capture_plugin_cls and issubclass(capture_plugin_cls, CapturePlugin)):
            return None
        capture_plugin = capture_plugin_cls()
        capture_plugin.load()
        capture_plugin.configure(settings)
        return capture_plugin

    def unload_running_plugins(self):
        for plugin in self.running_plugins.values():
            plugin.unload()
        self.running_plugins = {}

    def is_capturing(self) -> bool:
        return self.started