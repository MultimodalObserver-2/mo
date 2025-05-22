import os

from api.core.api.schemas.plugin import PluginRes
from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.settings import Settings
from api.core.utils.http_exceptions import (BadRequestException,
                                            NotFoundException)
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.capture.schemas.settings import SettingsPostReq, SettingsRes
from api.modules.capture.services.paths import (CAPTURE_SETTINGS_DIR,
                                                CAPTURE_SETTINGS_FILE)
from api.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from api.modules.organization.services.project_service import ProjectService


class CaptureSettingService:
    def __init__(self):
        self._settings_dir_name = CAPTURE_SETTINGS_DIR
        self._settings_file_name = CAPTURE_SETTINGS_FILE
        self.project_service = ProjectService()
        self.plugin_management = PluginManagement()
        self.file_management = FileManagement()

    def _get_settings_dir_path(self, project_name: str):
        dir_path = self.project_service.get_project_dir_path(project_name)
        settings_dir_path = os.path.join(dir_path, self._settings_dir_name)
        return settings_dir_path

    def _get_settings_storage(self, project_name: str):
        if not self.file_management.exists(self._get_settings_dir_path(project_name)):
            self.file_management.create_directory(
                dir_name=self._settings_dir_name,
                rel_path=self.project_service.get_project_dir_path(
                    project_name),
            )
        dir_path = self._get_settings_dir_path(project_name)
        return JsonStorage(file_name=self._settings_file_name, rel_path=dir_path)

    def add_capture_settings(self, project_name: str, settings: SettingsPostReq) -> SettingsRes:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        if not self.plugin_management.plugin_from_type_exists(settings.plugin_name, CapturePlugin):
            raise NotFoundException(f"Capture plugin {settings.plugin_name} does not exist.")

        plugin_properties = self.plugin_management.get_plugin_properties(settings.plugin_name)
        if not plugin_properties:
            raise NotFoundException(f"Plugin properties for {settings.plugin_name} do not exist.")

        try:
            plugin_properties.validate(Settings(settings.settings))
        except Exception as e:
            raise BadRequestException(
                f"Invalid settings for plugin {settings.plugin_name}: {str(e)}"
            )

        settings_storage = self._get_settings_storage(project_name)
        if self.exists(project_name, settings.name):
            raise BadRequestException(f"Settings with name {settings.name} already exists.")

        plugin_metadata = self.plugin_management.get_plugin_metadata(settings.plugin_name)
        if not plugin_metadata:
            raise NotFoundException(f"Plugin metadata for {settings.plugin_name} does not exist.")

        plugin_icon = PluginRes.get_icon_path(
            plugin_metadata._location or "", plugin_metadata.icon_path or "")

        final_settings = SettingsRes(
            name=settings.name,
            plugin_name=settings.plugin_name,
            plugin_icon=plugin_icon,
            settings=settings.settings,
        )
        settings_storage.insert_one(final_settings.model_dump())

        return final_settings

    def get_all_capture_settings(self, project_name: str) -> list[SettingsRes]:
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        
        settings_storage = self._get_settings_storage(project_name)
        settings_list = settings_storage.find_all()
        return [SettingsRes(**settings) for settings in settings_list]

    def exists(self, project_name: str, setting_name: str) -> bool:
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        settings_storage = self._get_settings_storage(project_name)
        return settings_storage.exists({"name": setting_name})
