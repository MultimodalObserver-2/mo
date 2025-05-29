import os

from api.core.api.schemas.plugin import PluginRes
from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.settings import Settings
from api.core.utils.http_exceptions import (AlreadyExistsException, BadRequestException,
                                            NotFoundException)
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.capture.schemas.settings import SettingsData, SettingsPostReq, SettingsPutReq, SettingsRes
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
            raise NotFoundException(
                f"Capture plugin {settings.plugin_name} does not exist.")

        try:
            self.plugin_management.validate_plugin_properties(settings.plugin_name, Settings(settings.settings))
        except Exception as e:
            raise BadRequestException(
                f"Invalid settings for plugin {settings.plugin_name}: {str(e)}"
            )

        settings_storage = self._get_settings_storage(project_name)
        if self.exists(project_name, settings.name):
            raise AlreadyExistsException(
                f"Settings with name {settings.name} already exists.")

        plugin_metadata = self.plugin_management.get_plugin_metadata(
            settings.plugin_name)
        if not plugin_metadata:
            raise NotFoundException(
                f"Plugin metadata for {settings.plugin_name} does not exist.")

        plugin_icon = PluginRes.get_icon_path(
            plugin_metadata._location or "", plugin_metadata.icon_path or "")

        final_settings = SettingsData(
            name=settings.name,
            plugin_name=settings.plugin_name,
            settings=settings.settings,
        )
        settings_storage.insert_one(final_settings.model_dump())

        return SettingsRes(
            name=settings.name,
            plugin_name=settings.plugin_name,
            plugin_icon=plugin_icon,
            settings=settings.settings,
            plugin_is_loaded=plugin_metadata._is_loaded
        )

    def get_all_capture_settings(self, project_name: str) -> list[SettingsRes]:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        settings_storage = self._get_settings_storage(project_name)
        settings_dict_list = settings_storage.find_all()
        settings_list = []
        for settings_dict in settings_dict_list:
            settings_data = SettingsData(**settings_dict)
            plugin_metadata = self.plugin_management.get_plugin_metadata(
                settings_data.plugin_name)
            settings = SettingsRes(
                name=settings_data.name,
                plugin_name=settings_data.plugin_name,
                settings=settings_data.settings,
            )
            if plugin_metadata:
                plugin_icon = PluginRes.get_icon_path(
                    plugin_metadata._location or "", plugin_metadata.icon_path or "")
                settings.plugin_icon = plugin_icon
                settings.plugin_is_loaded = plugin_metadata._is_loaded

            settings_list.append(settings)
        return settings_list

    def get_capture_settings(self, project_name: str, setting_name: str) -> SettingsRes:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        settings_storage = self._get_settings_storage(project_name)
        settings = settings_storage.find_one({"name": setting_name})
        if not settings:
            raise NotFoundException(
                f"Settings with name {setting_name} do not exist.")
        
        settings_data = SettingsData(**settings)
        plugin_metadata = self.plugin_management.get_plugin_metadata(
            settings_data.plugin_name)
        settings = SettingsRes(
            name=settings_data.name,
            plugin_name=settings_data.plugin_name,
            settings=settings_data.settings,
        )
        if plugin_metadata:
            plugin_icon = PluginRes.get_icon_path(
                plugin_metadata._location or "", plugin_metadata.icon_path or "")
            settings.plugin_icon = plugin_icon
            settings.plugin_is_loaded = plugin_metadata._is_loaded
        
        return settings

    def update_capture_settings(self, project_name: str, setting_name: str, settings: SettingsPutReq) -> SettingsRes:
        existing_settings = self.get_capture_settings(
            project_name, setting_name)

        existing_settings.settings = settings.settings if settings.settings else existing_settings.settings

        try:
            self.plugin_management.validate_plugin_properties(existing_settings.plugin_name, Settings(settings.settings))
        except Exception as e:
            raise BadRequestException(
                f"Invalid settings for plugin {existing_settings.plugin_name}: {str(e)}"
            )

        if settings.name != None and settings.name != setting_name:
            if self.exists(project_name, settings.name):
                raise AlreadyExistsException(
                    f"Settings with name {settings.name} already exists.")
            existing_settings.name = settings.name

        settings_data = SettingsData(
            name=existing_settings.name,
            plugin_name=existing_settings.plugin_name,
            settings=existing_settings.settings,
        )

        settings_storage = self._get_settings_storage(project_name)
        settings_storage.update(
            {"name": setting_name},
            settings_data.model_dump()
        )

        return existing_settings

    def delete_capture_settings(self, project_name: str, setting_name: str) -> None:
        if not self.exists(project_name, setting_name):
            raise NotFoundException(
                "Settings with name {setting_name} do not exist.")

        settings_storage = self._get_settings_storage(project_name)
        settings_storage.delete_one({"name": setting_name})

    def exists(self, project_name: str, setting_name: str) -> bool:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))
        settings_storage = self._get_settings_storage(project_name)
        return settings_storage.exists({"name": setting_name})
    
    def get_all_capture_settings_loaded(self, project_name: str) -> list[SettingsRes]:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        settings_storage = self._get_settings_storage(project_name)
        settings_dict_list = settings_storage.find_all()
        settings_list = []
        for settings_dict in settings_dict_list:
            settings_data = SettingsData(**settings_dict)
            plugin_metadata = self.plugin_management.get_plugin_metadata(
                settings_data.plugin_name)
            if plugin_metadata and plugin_metadata._is_loaded:
                settings = SettingsRes(
                    name=settings_data.name,
                    plugin_name=settings_data.plugin_name,
                    settings=settings_data.settings,
                )
                plugin_icon = PluginRes.get_icon_path(
                    plugin_metadata._location or "", plugin_metadata.icon_path or "")
                settings.plugin_icon = plugin_icon
                settings.plugin_is_loaded = plugin_metadata._is_loaded
                settings_list.append(settings)
        return settings_list
