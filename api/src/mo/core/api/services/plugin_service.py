from typing import Any, Optional

from fastapi import UploadFile

from mo.core.utils.i18n import translate
from mo.core.api.schemas.plugin import PluginRes, PropertyRes
from mo.core.config.constants import RELATIVE_PLUGINS_DIR_PATH
from mo.core.file_management.file_management import FileManagement
from mo.core.plugin.dir_observer import PluginsDirHandler
from mo.core.plugin.manager import PluginManager
from mo.core.plugin.models.settings import Settings
from mo.core.utils.http_exceptions import BadRequestException
from mo.core.plugin.loading import plugin_ready_event


class PluginService:
    """Service class for managing plugins, including adding, retrieving,
    and removing plugins, as well as retrieving their properties.

    This service interacts with the PluginManager and handles file operations
    related to plugins, such as uploading and extracting zip files.
    """
    PLUGIN_NOT_FOUND = "core.pluginNotFound"

    def __init__(self):
        """Initializes the PluginService, setting up the plugin manager,
        plugins directory handler, and file management system.
        """
        self.plugin_manager = PluginManager()
        self.plugins_dir_handler = PluginsDirHandler()
        self.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.file_management = FileManagement(self.plugins_dir)

    async def add_plugin(self, file: UploadFile) -> PluginRes:
        """Adds a new plugin from a zip file.
        Args:
            file (UploadFile): The zip file containing the plugin to be added.
        Returns:
            PluginRes: The metadata of the added plugin.
        Raises:
            BadRequestException: If the file is not a valid zip archive or if
            there is an error during plugin registration.
        """
        self.plugins_dir_handler.suspend()
        file_name = file.filename
        if file_name is None or not file_name.endswith(".zip"):
            raise BadRequestException(translate("core.fileMustBeZip"))
        dir_name = self.file_management.get_unique_name(file_name.replace(".zip", ""))

        dir_path = self.file_management.create_directory(dir_name)
        zip_path = await self.file_management.copy_file_obj_async(
            file.file, dir_name, dir_path)
        await self.file_management.extract_zip_async(zip_path, dir_path)
        await self.file_management.delete_file_async(zip_path)
        try:
            plugin_metadata = self.plugin_manager.register_plugin(dir_name)
        except Exception as e:
            # If registration fails, we need to clean up the directory
            await self.file_management.delete_directory_async(dir_name)
            self.plugins_dir_handler.resume()
            raise BadRequestException(
                translate("core.failedToAddPlugin", file_name=file_name, error=str(e))
            )
        self.plugins_dir_handler.add_known_dir(dir_name)
        self.plugins_dir_handler.resume()
        return PluginRes.from_plugin_metadata(plugin_metadata)

    async def get_all_plugins(self) -> list[PluginRes]:
        """Retrieves metadata for all registered plugins.
        Returns:
            list[PluginRes]: A list of PluginRes objects containing metadata for each plugin.
        """
        await plugin_ready_event.wait()  # Ensure plugins are ready before processing
        plugins = self.plugin_manager.get_all_plugins_metadata()
        return [PluginRes.from_plugin_metadata(plugin) for plugin in plugins]

    def get_plugin(self, final_id: str) -> PluginRes:
        """Retrieves metadata for a specific plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin to retrieve.
        Returns:
            PluginRes: The metadata of the requested plugin.
        Raises:
            BadRequestException: If the plugin with the specified final ID does not exist.
        """
        plugin_metadata = self.plugin_manager.get_plugin_metadata(final_id)
        if not plugin_metadata:
            raise BadRequestException(
                translate(self.PLUGIN_NOT_FOUND, final_id=final_id)
            )
        return PluginRes.from_plugin_metadata(plugin_metadata)

    async def remove_plugin(self, final_id: str) -> None:
        """Removes a plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin to remove.
        Raises:
            BadRequestException: If the plugin with the specified final ID does not exist
            or if there is an error during removal.
        """
        plugin_metadata = self.plugin_manager.get_plugin_metadata(final_id)
        if not plugin_metadata:
            raise BadRequestException(
                translate(self.PLUGIN_NOT_FOUND, final_id=final_id)
            )
        self.plugins_dir_handler.suspend()
        dir_name = self.plugin_manager.get_plugin_dir_name(final_id)
        try:
            dir_name = self.plugin_manager.remove_plugin(final_id)
            await self.file_management.delete_directory_async(dir_name)
            self.plugins_dir_handler.remove_known_dir(dir_name)
        except Exception as e:
            # If removal fails, we need to re-register the plugin and resume the handler
            # to ensure the plugin is still recognized in the system.
            self.plugin_manager.register_plugin(dir_name)
            self.plugins_dir_handler.add_known_dir(dir_name)
            self.plugins_dir_handler.resume()
            raise BadRequestException(
                translate("core.failedToRemovePlugin", final_id=final_id, error=str(e))
            )
        finally:
            self.plugins_dir_handler.resume()

    def get_plugin_properties(
        self, final_id: str, settings: Optional[dict[str, Any]] = None
    ) -> list[PropertyRes]:
        """Retrieves properties for a specific plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin whose properties are to be retrieved.
            settings (Optional[dict[str, Any]]): Optional settings to apply when retrieving properties.
        Returns:
            list[PropertyRes]: A list of PropertyRes objects containing the properties of the plugin.
        Raises:
            BadRequestException: If the plugin with the specified final ID does not exist.
        """
        plugin_metadata = self.plugin_manager.get_plugin_metadata(final_id)
        if not plugin_metadata:
            raise BadRequestException(
                translate(self.PLUGIN_NOT_FOUND, final_id=final_id)
            )

        plugin_properties = self.plugin_manager.get_plugin_properties(
            final_id, Settings(settings) if settings else None
        )
        if not plugin_properties:
            return []
        return [PropertyRes(**prop) for prop in plugin_properties]
