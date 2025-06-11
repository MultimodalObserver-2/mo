from typing import Any, Optional

from fastapi import UploadFile

from mo.core.api.schemas.plugin import PluginRes, PropertyRes
from mo.core.config.constants import RELATIVE_PLUGINS_DIR_PATH
from mo.core.file_management.file_management import FileManagement
from mo.core.plugin.dir_observer import PluginsDirHandler
from mo.core.plugin.manager import PluginManager
from mo.core.plugin.models.settings import Settings
from mo.core.utils.http_exceptions import BadRequestException


class PluginService:
    def __init__(self):
        self.plugin_management = PluginManager()
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

    def get_plugin(self, final_id: str) -> PluginRes:
        plugin_metadata = self.plugin_management.get_plugin_metadata(final_id)
        if not plugin_metadata:
            raise BadRequestException(f"Plugin '{final_id}' not found.")
        return PluginRes.from_plugin_metadata(plugin_metadata)

    def remove_plugin(self, final_id: str) -> None:
        plugin_metadata = self.plugin_management.get_plugin_metadata(final_id)
        if not plugin_metadata:
            raise BadRequestException(f"Plugin '{final_id}' not found.")
        self.plugins_dir_handler.suspend()
        dir_name = self.plugin_management.get_plugin_dir_name(final_id)
        try:
            dir_name = self.plugin_management.remove_plugin(final_id)
            self.file_management.delete_directory(dir_name)
            self.plugins_dir_handler.remove_known_dir(dir_name)
        except Exception as e:
            self.plugin_management.register_plugin(dir_name)
            self.plugins_dir_handler.add_known_dir(dir_name)
            self.plugins_dir_handler.resume()
            raise BadRequestException(f"Failed to remove plugin '{final_id}'. \nError: {e}")
        finally:
            self.plugins_dir_handler.resume()

    def get_plugin_properties(
        self, final_id: str, settings: Optional[dict[str, Any]] = None
    ) -> list[PropertyRes]:
        plugin_metadata = self.plugin_management.get_plugin_metadata(final_id)
        if not plugin_metadata:
            raise BadRequestException(f"Plugin '{final_id}' not found.")

        plugin_properties = self.plugin_management.get_plugin_properties(
            final_id, Settings(settings) if settings else None
        )
        if not plugin_properties:
            return []
        return [PropertyRes(**prop) for prop in plugin_properties]
