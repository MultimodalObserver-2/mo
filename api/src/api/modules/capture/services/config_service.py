import os

from api.core.api.schemas.plugin import PluginRes
from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.plugin.plugin_manager import PluginManager
from api.core.plugin.settings import Settings
from api.core.utils.http_exceptions import (AlreadyExistsException, BadRequestException,
                                            NotFoundException)
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.capture.schemas.capture_config import CaptureConfigData, CaptureConfigLoaded, CaptureConfigPostReq, CaptureConfigPutReq, CaptureConfigRes
from api.modules.capture.services.paths import (CAPTURE_CONFIGS_DIR,
                                                CAPTURE_CONFIGS_FILE)
from api.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from api.modules.organization.services.project_service import ProjectService


class CaptureConfigService:
    def __init__(self):
        self._settings_dir_name = CAPTURE_CONFIGS_DIR
        self._settings_file_name = CAPTURE_CONFIGS_FILE
        self.project_service = ProjectService()
        self.plugin_management = PluginManager()
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

    def add_capture_config(self, project_name: str, config: CaptureConfigPostReq) -> CaptureConfigRes:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        if not self.plugin_management.plugin_from_type_exists(config.plugin_id, CapturePlugin):
            raise NotFoundException(
                f"Capture plugin {config.plugin_id} does not exist.")

        try:
            self.plugin_management.validate_plugin_settings(
                config.plugin_id, Settings(config.settings))
        except Exception as e:
            raise BadRequestException(
                f"Invalid settings for plugin {config.plugin_id}: {str(e)}"
            )

        settings_storage = self._get_settings_storage(project_name)
        if self.exists(project_name, config.name):
            raise AlreadyExistsException(
                f"Configuration with name {config.name} already exists.")

        plugin_metadata = self.plugin_management.get_plugin_metadata(
            config.plugin_id)
        if not plugin_metadata:
            raise NotFoundException(
                f"Plugin metadata for {config.plugin_id} does not exist.")

        plugin_icon = PluginRes.get_icon_path(
            plugin_metadata._location or "", plugin_metadata.icon_path or "")

        final_config = CaptureConfigData(
            name=config.name,
            plugin_id=config.plugin_id,
            settings=config.settings,
        )
        settings_storage.insert_one(final_config.model_dump())

        return CaptureConfigRes(
            name=config.name,
            plugin_id=config.plugin_id,
            plugin_icon=plugin_icon,
            settings=config.settings,
            plugin_is_loaded=plugin_metadata._is_loaded
        )

    def get_all_capture_configs(self, project_name: str) -> list[CaptureConfigRes]:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        settings_storage = self._get_settings_storage(project_name)
        configs_dict = settings_storage.find_all()
        configs = []
        for config_dict in configs_dict:
            config_data = CaptureConfigData(**config_dict)
            plugin_metadata = self.plugin_management.get_plugin_metadata(
                config_data.plugin_id)
            config = CaptureConfigRes(
                name=config_data.name,
                plugin_id=config_data.plugin_id,
                settings=config_data.settings,
            )
            if plugin_metadata:
                plugin_icon = PluginRes.get_icon_path(
                    plugin_metadata._location or "", plugin_metadata.icon_path or "")
                config.plugin_icon = plugin_icon
                config.plugin_is_loaded = plugin_metadata._is_loaded

            configs.append(config)
        return configs

    def get_capture_config(self, project_name: str, config_name: str) -> CaptureConfigRes:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        settings_storage = self._get_settings_storage(project_name)
        settings = settings_storage.find_one({"name": config_name})
        if not settings:
            raise NotFoundException(
                f"Configuration with name {config_name} do not exist.")
        
        settings_data = CaptureConfigData(**settings)
        plugin_metadata = self.plugin_management.get_plugin_metadata(
            settings_data.plugin_id)
        settings = CaptureConfigRes(
            name=settings_data.name,
            plugin_id=settings_data.plugin_id,
            settings=settings_data.settings,
        )
        if plugin_metadata:
            plugin_icon = PluginRes.get_icon_path(
                plugin_metadata._location or "", plugin_metadata.icon_path or "")
            settings.plugin_icon = plugin_icon
            settings.plugin_is_loaded = plugin_metadata._is_loaded
        
        return settings

    def update_capture_config(self, project_name: str, config_name: str, config: CaptureConfigPutReq) -> CaptureConfigRes:
        existing_config = self.get_capture_config(
            project_name, config_name)

        existing_config.settings = config.settings if config.settings else existing_config.settings

        try:
            self.plugin_management.validate_plugin_settings(existing_config.plugin_id, Settings(config.settings))
        except Exception as e:
            raise BadRequestException(
                f"Invalid settings for plugin {existing_config.plugin_id}: {str(e)}"
            )

        if config.name != None and config.name != config_name:
            if self.exists(project_name, config.name):
                raise AlreadyExistsException(
                    f"Configuration with name {config.name} already exists.")
            existing_config.name = config.name

        config_data = CaptureConfigData(
            name=existing_config.name,
            plugin_id=existing_config.plugin_id,
            settings=existing_config.settings,
        )

        settings_storage = self._get_settings_storage(project_name)
        settings_storage.update(
            {"name": config_name},
            config_data.model_dump()
        )

        return existing_config

    def delete_capture_config(self, project_name: str, config_name: str) -> None:
        if not self.exists(project_name, config_name):
            raise NotFoundException(
                "Configuration with name {setting_name} do not exist.")

        settings_storage = self._get_settings_storage(project_name)
        settings_storage.delete_one({"name": config_name})

    def exists(self, project_name: str, config_name: str) -> bool:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))
        settings_storage = self._get_settings_storage(project_name)
        return settings_storage.exists({"name": config_name})
    
    def get_all_configs_loaded(self, project_name: str) -> list[CaptureConfigLoaded]:
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        settings_storage = self._get_settings_storage(project_name)
        config_dicts = settings_storage.find_all()
        configs = []
        for config_dict in config_dicts:
            config_data = CaptureConfigData(**config_dict)
            plugin_metadata = self.plugin_management.get_plugin_metadata(
                config_data.plugin_id)
            if plugin_metadata and plugin_metadata._is_loaded:
                config = CaptureConfigLoaded(
                    name=config_data.name,
                    plugin_id=config_data.plugin_id,
                    plugin_metadata=plugin_metadata,
                    settings=config_data.settings,
                )
                configs.append(config)
        return configs
