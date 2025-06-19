import os

from mo.core.file_management.file_management import FileManagement
from mo.core.file_management.json_storage import JsonStorage
from mo.core.plugin.manager import PluginManager
from mo.core.utils.http_exceptions import (
    AlreadyExistsException,
    NotFoundException,
)

from mo.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from mo.modules.organization.services.project_service import ProjectService
from mo.modules.visualization.routers.playback_config import PlaybackConfigPostReq, PlaybackConfigPutReq, PlaybackConfigRes
from mo.modules.visualization.schemas.playback_config import PlaybackConfigData
from mo.modules.visualization.services.paths import PLAYBACK_CONFIGS_FILE, VISUALIZATION_CONFIGS_DIR


class PlaybackConfigService:
    """Service for managing playback configurations, including adding, retrieving, updating, and deleting configurations.
    This service interacts with the project service to ensure that configurations are stored in the correct project directory.

    Configurations are stored in a JSON file within a dedicated directory for capture configurations.
    """

    def __init__(self):
        """Initializes the PlaybackConfigService with necessary dependencies."""
        self._settings_dir_name = VISUALIZATION_CONFIGS_DIR
        self._settings_file_name = PLAYBACK_CONFIGS_FILE
        self.project_service = ProjectService()
        self.plugin_management = PluginManager()
        self.file_management = FileManagement()

    def _get_configurations_dir_path(self, project_name: str):
        """Returns the directory path where playback configurations are stored for a given project.
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
        """Returns a JsonStorage instance for managing playback configurations for a given project.
        Args:
            project_name (str): The name of the project for which to get the configuration storage.
        Returns:
            JsonStorage: An instance of JsonStorage for managing playback configurations.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.file_management.exists(self._get_configurations_dir_path(project_name)):
            self.file_management.create_directory(
                dir_name=self._settings_dir_name,
                rel_path=self.project_service.get_project_dir_path(
                    project_name),
            )
        dir_path = self._get_configurations_dir_path(project_name)
        return JsonStorage(file_name=self._settings_file_name, rel_path=dir_path)

    def add_capture_config(
        self, project_name: str, config: PlaybackConfigPostReq
    ) -> PlaybackConfigRes:
        """Adds a new playback configuration for a given project.
        Args:
            project_name (str): The name of the project to which the configuration will be added.
            config (PlaybackConfigPostReq): The configuration data to be added.
        Returns:
            PlaybackConfigRes: The response containing the added configuration details.
        Raises:
            NotFoundException: If the project does not exist or if the plugin does not exist.
            AlreadyExistsException: If a configuration with the same name already exists.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        configurations_storage = self._get_configurations_storage(project_name)
        if self.exists(project_name, config.name):
            raise AlreadyExistsException(
                f"Configuration with name {config.name} already exists.")

        final_config = PlaybackConfigData(
            name=config.name,
            plugin_id=config.plugin_id,
            settings=config.settings,
        )
        configurations_storage.insert_one(final_config.model_dump())

        return PlaybackConfigRes(
            name=config.name,
            plugin_id=config.plugin_id,
            settings=config.settings,
        )

    def get_all_capture_configs(self, project_name: str) -> list[PlaybackConfigRes]:
        """Retrieves all playback configurations for a given project.
        Args:
            project_name (str): The name of the project for which to retrieve configurations.
        Returns:
            list[PlaybackConfigRes]: A list of PlaybackConfigRes objects representing all configurations.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        configurations_storage = self._get_configurations_storage(project_name)
        configs_dict = configurations_storage.find_all()
        return [
            PlaybackConfigRes(
                name=config_data["name"],
                plugin_id=config_data["plugin_id"],
                settings=config_data["settings"],
            )
            for config_data in configs_dict
        ]

    def get_capture_config(self, project_name: str, config_name: str) -> PlaybackConfigRes:
        """Retrieves a specific playback configuration by name for a given project.
        Args:
            project_name (str): The name of the project from which to retrieve the configuration.
            config_name (str): The name of the configuration to retrieve.
        Returns:
            PlaybackConfigRes: The response containing the requested configuration details.
        Raises:
            NotFoundException: If the project does not exist or if the configuration does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))

        configs_storage = self._get_configurations_storage(project_name)
        settings = configs_storage.find_one({"name": config_name})
        if not settings:
            raise NotFoundException(
                f"Configuration with name {config_name} do not exist.")

        settings_data = PlaybackConfigData(**settings)
        settings = PlaybackConfigRes(
            name=settings_data.name,
            plugin_id=settings_data.plugin_id,
            settings=settings_data.settings,
        )

        return settings

    def update_capture_config(
        self, project_name: str, config_name: str, config: PlaybackConfigPutReq
    ) -> PlaybackConfigRes:
        """Updates an existing playback configuration for a given project.
        Args:
            project_name (str): The name of the project in which the configuration exists.
            config_name (str): The name of the configuration to update.
            config (CaptureConfigPutReq): The updated configuration data.
        Returns:
            CaptureConfigRes: The response containing the updated configuration details.
        Raises:
            NotFoundException: If the project does not exist or if the configuration does not exist.
            AlreadyExistsException: If a configuration with the new name already exists.
        """
        existing_config = self.get_capture_config(project_name, config_name)

        existing_config.settings = config.settings if config.settings else existing_config.settings

        if config.name != None and config.name != config_name:
            if self.exists(project_name, config.name):
                raise AlreadyExistsException(
                    f"Configuration with name {config.name} already exists."
                )
            existing_config.name = config.name

        config_data = PlaybackConfigData(
            name=existing_config.name,
            plugin_id=existing_config.plugin_id,
            settings=existing_config.settings,
        )

        configs_storage = self._get_configurations_storage(project_name)
        configs_storage.update({"name": config_name}, config_data.model_dump())

        return existing_config

    def delete_capture_config(self, project_name: str, config_name: str) -> None:
        """Deletes a specific playback configuration by name for a given project.
        Args:
            project_name (str): The name of the project from which to delete the configuration.
            config_name (str): The name of the configuration to delete.
        Raises:
            NotFoundException: If the project does not exist or if the configuration does not exist.
        """
        if not self.exists(project_name, config_name):
            raise NotFoundException(
                "Configuration with name {setting_name} do not exist.")

        configs_storage = self._get_configurations_storage(project_name)
        configs_storage.delete_one({"name": config_name})

    def exists(self, project_name: str, config_name: str) -> bool:
        """Checks if a specific playback configuration exists for a given project.
        Args:
            project_name (str): The name of the project in which to check for the configuration.
            config_name (str): The name of the configuration to check.
        Returns:
            bool: True if the configuration exists, False otherwise.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(
                PROJECT_DOES_NOT_EXIST.format(name=project_name))
        configs_storage = self._get_configurations_storage(project_name)
        return configs_storage.exists({"name": config_name})
