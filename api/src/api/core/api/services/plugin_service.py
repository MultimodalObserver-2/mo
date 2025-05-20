import os
from typing import Any, Optional

from fastapi import UploadFile

from api.core.api.schemas.plugin import PluginRes, PropertyRes
from api.core.config.constants import RELATIVE_PLUGINS_DIR_PATH
from api.core.file_management.file_management import FileManagement
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.plugins_dir_observer import PluginsDirHandler
from api.core.plugin.settings import Settings
from api.core.utils.http_exceptions import BadRequestException


class PluginService:
    def __init__(self):
        self.plugin_management = PluginManagement()
        self.plugins_dir_handler = PluginsDirHandler()
        self.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.file_management = FileManagement(self.plugins_dir)

    def add_plugin(self, file: UploadFile) -> PluginRes:
        self.plugins_dir_handler.suspend()
        file_name = file.filename
        if file_name is None or not file_name.endswith(".zip"):
            raise BadRequestException("File must be a zip archive.")
        dir_name = self.file_management.get_unique_name(file_name.replace(".zip", ""))

        dir_path = self.file_management.create_directory(dir_name)
        zip_path = self.file_management.copy_file_obj(file.file, dir_name, dir_path)
        self.file_management.extract_zip(zip_path, dir_path)
        self.file_management.delete_file(zip_path)
        try:
            plugin_metadata = self.plugin_management.register_plugin(dir_name)
        except Exception as e:
            self.file_management.delete_directory(dir_name)
            raise BadRequestException(f"Failed to add plugin '{file_name}'. \nError: {e}")
        self.plugins_dir_handler.add_known_dir(dir_name)
        self.plugins_dir_handler.resume()
        return PluginRes.from_plugin_metadata(plugin_metadata)

    def get_all_plugins(self) -> list[PluginRes]:
        plugins = self.plugin_management.get_all_plugins_metadata()
        return [PluginRes.from_plugin_metadata(plugin) for plugin in plugins]

    def get_plugin(self, plugin_name: str) -> PluginRes:
        plugin_metadata = self.plugin_management.get_plugin_metadata(plugin_name)
        if not plugin_metadata:
            raise BadRequestException(f"Plugin '{plugin_name}' not found.")
        return PluginRes.from_plugin_metadata(plugin_metadata)

    def remove_plugin(self, plugin_name: str) -> None:
        plugin_metadata = self.plugin_management.get_plugin_metadata(plugin_name)
        if not plugin_metadata:
            raise BadRequestException(f"Plugin '{plugin_name}' not found.")
        self.plugins_dir_handler.suspend()
        dir_name = self.plugin_management.remove_plugin(plugin_name)
        self.file_management.delete_directory(dir_name)
        self.plugins_dir_handler.remove_known_dir(dir_name)
        self.plugins_dir_handler.resume()

    def get_plugin_properties(
        self, plugin_name: str, settings: Optional[dict[str, Any]] = None
    ) -> list[PropertyRes]:
        plugin_metadata = self.plugin_management.get_plugin_metadata(plugin_name)
        if not plugin_metadata:
            raise BadRequestException(f"Plugin '{plugin_name}' not found.")

        plugin_properties = self.plugin_management.get_plugin_properties(plugin_name)
        if not plugin_properties:
            return []

        properties = plugin_properties.get_properties(
            Settings(settings=settings) if settings else None
        )
        return [PropertyRes.from_property(prop) for prop in properties]
