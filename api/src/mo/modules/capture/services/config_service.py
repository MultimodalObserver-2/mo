import os

from mo.core.api.schemas.plugin import PluginRes
from mo.core.file_management.file_management import FileManagement
from mo.core.file_management.json_storage import JsonStorage
from mo.core.plugin.manager import PluginManager
from mo.core.plugin.models.settings import Settings
from mo.core.utils.http_exceptions import (
    AlreadyExistsException,
    BadRequestException,
    NotFoundException,
)
from mo.modules.capture.plugins.capture_plugin import CapturePlugin
from mo.modules.capture.schemas.capture_config import (
    CaptureConfigData,
    CaptureConfigLoaded,
    CaptureConfigPostReq,
    CaptureConfigPutReq,
    CaptureConfigRes,
)
from mo.modules.capture.services.capture_plugin_callbacks import get_file_extension_callback
from mo.modules.capture.services.paths import CAPTURE_CONFIGS_DIR, CAPTURE_CONFIGS_FILE
from mo.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from mo.modules.organization.services.project_service import ProjectService
from mo.core.utils.i18n import translate


class CaptureConfigService:
    """Service for managing capture configurations, including adding, retrieving, updating, and deleting configurations.
    It also provides functionality to check if a configuration exists and to retrieve all configurations that are loaded.
    This service interacts with the project service to ensure that configurations are stored in the correct project directory.

    Configurations are stored in a JSON file within a dedicated directory for capture configurations.
    """

    def __init__(self):
        """Initializes the CaptureConfigService with necessary dependencies."""
        self._settings_dir_name = CAPTURE_CONFIGS_DIR
        self._settings_file_name = CAPTURE_CONFIGS_FILE
        self.project_service = ProjectService()
        self.plugin_management = PluginManager()
        self.file_management = FileManagement()

    def _get_configurations_dir_path(self, project_name: str):
        """Returns the directory path where capture configurations are stored for a given project.
        Args:
            project_name (str): The name of the project for which to get the configuration directory path.
        Returns:
            str: The path to the configuration directory for the specified project.
        Raises:
            NotFoundException: If the project does not exist.
        """
        dir_path = self.project_service.get_project_dir_path(project_name)
        settings_dir_path = os.path.join(dir_path, self._settings_dir_name)
        return settings_dir_path

    def _get_configurations_storage(self, project_name: str):
        """Returns a JsonStorage instance for managing capture configurations for a given project.
        Args:
            project_name (str): The name of the project for which to get the configuration storage.
        Returns:
            JsonStorage: An instance of JsonStorage for managing capture configurations.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.file_management.exists(self._get_configurations_dir_path(project_name)):
            self.file_management.create_directory(
                dir_name=self._settings_dir_name,
                rel_path=self.project_service.get_project_dir_path(project_name),
            )
        dir_path = self._get_configurations_dir_path(project_name)
        return JsonStorage(file_name=self._settings_file_name, rel_path=dir_path)

    def add_capture_config(
        self, project_name: str, config: CaptureConfigPostReq
    ) -> CaptureConfigRes:
        """Adds a new capture configuration for a given project.
        Args:
            project_name (str): The name of the project to which the configuration will be added.
            config (CaptureConfigPostReq): The configuration data to be added.
        Returns:
            CaptureConfigRes: The response containing the added configuration details.
        Raises:
            NotFoundException: If the project does not exist or if the plugin does not exist.
            AlreadyExistsException: If a configuration with the same name already exists.
            BadRequestException: If the provided settings for the plugin are invalid.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))

        if not self.plugin_management.plugin_from_type_exists(config.plugin_id, CapturePlugin):
            raise NotFoundException(
                translate("capture.pluginDoesNotExist",
                          plugin_id=config.plugin_id)
            )

        try:
            self.plugin_management.validate_plugin_settings(
                config.plugin_id, Settings(config.settings)
            )
        except Exception as e:
            raise BadRequestException(
                translate("capture.invalidPluginSettings",
                          plugin_id=config.plugin_id, error=str(e))
            )

        configurations_storage = self._get_configurations_storage(project_name)
        if self.exists(project_name, config.name):
            raise AlreadyExistsException(
                translate("capture.configAlreadyExists",
                          config_name=config.name)
            )

        plugin_metadata = self.plugin_management.get_plugin_metadata(
            config.plugin_id)
        if not plugin_metadata:
            raise NotFoundException(
                translate("capture.pluginMetadataNotFound",
                          plugin_id=config.plugin_id)
            )

        plugin_icon = PluginRes.get_icon_path(
            plugin_metadata._location or "", plugin_metadata.icon_path or ""
        )

        plugin_file_extension = None
        try:
            plugin_process = self.plugin_management.get_plugin_process(
                config.plugin_id)
            if plugin_process:
                plugin_process.add_plugin_instance(
                    config.name, Settings(config.settings), overwrite=True)
                plugin_file_extension = plugin_process.execute_callback_on_instance(
                    config.name, get_file_extension_callback)
        except Exception as e:
            raise BadRequestException(
                translate("capture.fileExtensionError",
                          plugin_id=config.plugin_id, error=str(e))
            )

        final_config = CaptureConfigData(
            name=config.name,
            plugin_id=config.plugin_id,
            settings=config.settings,
            file_extension=plugin_file_extension,
        )
        configurations_storage.insert_one(final_config.model_dump())

        return CaptureConfigRes(
            id=final_config.id,
            name=config.name,
            plugin_id=config.plugin_id,
            plugin_icon=plugin_icon,
            settings=config.settings,
            plugin_is_loaded=plugin_metadata._is_loaded,
            file_extension=plugin_file_extension,
        )

    def get_all_capture_configs(self, project_name: str) -> list[CaptureConfigRes]:
        """Retrieves all capture configurations for a given project.
        Args:
            project_name (str): The name of the project for which to retrieve configurations.
        Returns:
            list[CaptureConfigRes]: A list of CaptureConfigRes objects representing all configurations.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))

        configurations_storage = self._get_configurations_storage(project_name)
        configs_dict = configurations_storage.find_all()
        configs = []
        for config_dict in configs_dict:
            config_data = CaptureConfigData(**config_dict)
            plugin_metadata = self.plugin_management.get_plugin_metadata(config_data.plugin_id)
            config = CaptureConfigRes(
                id=config_data.id,
                name=config_data.name,
                plugin_id=config_data.plugin_id,
                settings=config_data.settings,
                file_extension=config_data.file_extension,
            )
            if plugin_metadata:
                plugin_icon = PluginRes.get_icon_path(
                    plugin_metadata._location or "", plugin_metadata.icon_path or ""
                )
                config.plugin_icon = plugin_icon
                config.plugin_is_loaded = plugin_metadata._is_loaded

            configs.append(config)
        return configs

    def get_capture_config(self, project_name: str, config_name: str) -> CaptureConfigRes:
        """Retrieves a specific capture configuration by name for a given project.
        Args:
            project_name (str): The name of the project from which to retrieve the configuration.
            config_name (str): The name of the configuration to retrieve.
        Returns:
            CaptureConfigRes: The response containing the requested configuration details.
        Raises:
            NotFoundException: If the project does not exist or if the configuration does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))

        configs_storage = self._get_configurations_storage(project_name)
        settings = configs_storage.find_one({"name": config_name})
        if not settings:
            raise NotFoundException(
                translate("capture.configDoesNotExist",
                          config_name=config_name)
            )

        settings_data = CaptureConfigData(**settings)
        plugin_metadata = self.plugin_management.get_plugin_metadata(settings_data.plugin_id)
        settings = CaptureConfigRes(
            id=settings_data.id,
            name=settings_data.name,
            plugin_id=settings_data.plugin_id,
            settings=settings_data.settings,
            file_extension=settings_data.file_extension,
        )
        if plugin_metadata:
            plugin_icon = PluginRes.get_icon_path(
                plugin_metadata._location or "", plugin_metadata.icon_path or ""
            )
            settings.plugin_icon = plugin_icon
            settings.plugin_is_loaded = plugin_metadata._is_loaded

        return settings

    def update_capture_config(
        self, project_name: str, config_name: str, config: CaptureConfigPutReq
    ) -> CaptureConfigRes:
        """Updates an existing capture configuration for a given project.
        Args:
            project_name (str): The name of the project in which the configuration exists.
            config_name (str): The name of the configuration to update.
            config (CaptureConfigPutReq): The updated configuration data.
        Returns:
            CaptureConfigRes: The response containing the updated configuration details.
        Raises:
            NotFoundException: If the project does not exist or if the configuration does not exist.
            AlreadyExistsException: If a configuration with the new name already exists.
            BadRequestException: If the provided settings for the plugin are invalid.
        """
        existing_config = self.get_capture_config(project_name, config_name)

        existing_config.settings = config.settings if config.settings else existing_config.settings

        try:
            self.plugin_management.validate_plugin_settings(
                existing_config.plugin_id, Settings(config.settings)
            )
        except Exception as e:
            raise BadRequestException(
                translate("capture.invalidPluginSettings",
                          plugin_id=existing_config.plugin_id, error=str(e))
            )

        if config.name is not None and config.name != config_name:
            if self.exists(project_name, config.name):
                raise AlreadyExistsException(
                    translate("capture.configAlreadyExists",
                              config_name=config.name)
                )
            existing_config.name = config.name

        plugin_file_extension = existing_config.file_extension
        try:
            plugin_process = self.plugin_management.get_plugin_process(
                existing_config.plugin_id)
            if plugin_process:
                plugin_process.add_plugin_instance(
                    existing_config.id, Settings(config.settings), overwrite=True)
                plugin_file_extension = plugin_process.execute_callback_on_instance(
                    existing_config.id, get_file_extension_callback)
        except Exception as e:
            raise BadRequestException(
                translate("capture.fileExtensionError",
                          plugin_id=existing_config.plugin_id, error=str(e))
            )
        config_data = CaptureConfigData(
            id=existing_config.id,
            name=existing_config.name,
            plugin_id=existing_config.plugin_id,
            settings=existing_config.settings,
            file_extension=plugin_file_extension,
        )

        configs_storage = self._get_configurations_storage(project_name)
        configs_storage.update({"name": config_name}, config_data.model_dump())

        return existing_config

    def delete_capture_config(self, project_name: str, config_name: str) -> None:
        """Deletes a specific capture configuration by name for a given project.
        Args:
            project_name (str): The name of the project from which to delete the configuration.
            config_name (str): The name of the configuration to delete.
        Raises:
            NotFoundException: If the project does not exist or if the configuration does not exist.
        """
        if not self.exists(project_name, config_name):
            raise NotFoundException(
                translate("capture.configDoesNotExist",
                          config_name=config_name)
            )

        configs_storage = self._get_configurations_storage(project_name)
        configs_storage.delete_one({"name": config_name})

    def exists(self, project_name: str, config_name: str) -> bool:
        """Checks if a specific capture configuration exists for a given project.
        Args:
            project_name (str): The name of the project in which to check for the configuration.
            config_name (str): The name of the configuration to check.
        Returns:
            bool: True if the configuration exists, False otherwise.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))
        configs_storage = self._get_configurations_storage(project_name)
        return configs_storage.exists({"name": config_name})

    def get_all_configs_loaded(self, project_name: str) -> list[CaptureConfigLoaded]:
        """Retrieves all capture configurations that are loaded for a given project.
        Args:
            project_name (str): The name of the project for which to retrieve loaded configurations.
        Returns:
            list[CaptureConfigLoaded]: A list of CaptureConfigLoaded objects representing all loaded configurations.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))

        configs_storage = self._get_configurations_storage(project_name)
        config_dicts = configs_storage.find_all()
        configs = []
        for config_dict in config_dicts:
            config_data = CaptureConfigData(**config_dict)
            plugin_metadata = self.plugin_management.get_plugin_metadata(
                config_data.plugin_id)
            if plugin_metadata and plugin_metadata._is_loaded:
                config = CaptureConfigLoaded(
                    id=config_data.id,
                    name=config_data.name,
                    plugin_id=config_data.plugin_id,
                    plugin_metadata=plugin_metadata,
                    settings=config_data.settings,
                    file_extension=config_data.file_extension,
                )
                configs.append(config)
        return configs
