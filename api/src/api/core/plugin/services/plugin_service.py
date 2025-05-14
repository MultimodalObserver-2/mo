import os

from fastapi import UploadFile

from api.core.config.constants import RELATIVE_PLUGINS_DIR_PATH
from api.core.file_management.file_management import FileManagement
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.plugins_dir_observer import PluginsDirHandler
from api.core.plugin.schemas.plugin import PlatformsRes, PluginRes
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
            self.plugin_management.add_plugin(dir_name)
        except Exception as e:
            self.file_management.delete_directory(dir_name)
            raise BadRequestException(f"Failed to add plugin {file_name}. Error: {e}")
        self.plugins_dir_handler.add_known_dir(dir_name)
        self.plugins_dir_handler.resume()
        plugin = self.plugin_management.get_plugin(dir_name)
        plugin_dict = {
            "name": plugin.name,
            "version": str(plugin.version),
            "description": plugin.description,
            "icon_path": plugin.icon_path or "",
            "repository": plugin.repository,
            "author": plugin.author or "",
            "author_email": plugin.author_email or "",
            "platforms": PlatformsRes(
                linux=plugin.platform.linux,
                windows=plugin.platform.windows,
                mac=plugin.platform.mac,
            ),
            "module": plugin._module,
            "location": dir_path,
        }
        return PluginRes(**plugin_dict)

    def get_all_plugins(self) -> list[PluginRes]:
        plugins = self.plugin_management.get_all_plugins()
        return [
            PluginRes(
                name=plugin.name,
                version=str(plugin.version),
                description=plugin.description,
                icon_path=(
                    os.path.join(plugin._location or "", plugin.icon_path or "")
                    if plugin.icon_path
                    else ""
                ),
                repository=plugin.repository,
                author=plugin.author or "",
                author_email=plugin.author_email or "",
                platforms=PlatformsRes(
                    linux=plugin.platform.linux,
                    windows=plugin.platform.windows,
                    mac=plugin.platform.mac,
                ),
                module=plugin._module,
                location=plugin._location or "",
            )
            for plugin in plugins
        ]

    def get_plugin(self, plugin_name: str, plugin_version: str) -> PluginRes:
        plugin = self.plugin_management.get_plugin_by_name_and_version(plugin_name, plugin_version)
        if not plugin:
            raise BadRequestException(f"Plugin {plugin_name} v{plugin_version} not found.")
        plugin_dict = {
            "name": plugin.name,
            "version": str(plugin.version),
            "description": plugin.description,
            "icon_path": (
                os.path.join(plugin._location or "", plugin.icon_path or "")
                if plugin.icon_path
                else ""
            ),
            "repository": plugin.repository,
            "author": plugin.author or "",
            "author_email": plugin.author_email or "",
            "platforms": PlatformsRes(
                linux=plugin.platform.linux,
                windows=plugin.platform.windows,
                mac=plugin.platform.mac,
            ),
            "module": plugin._module,
            "location": plugin._location or "",
        }
        return PluginRes(**plugin_dict)

    def remove_plugin(self, plugin_name: str, plugin_version: str) -> None:
        plugin = self.plugin_management.get_plugin_by_name_and_version(plugin_name, plugin_version)
        if not plugin:
            raise BadRequestException(f"Plugin {plugin_name} v{plugin_version} not found.")
        self.plugins_dir_handler.suspend()
        dir_name = self.plugin_management.remove_plugin_by_name_and_version(
            plugin_name, plugin_version
        )
        self.file_management.delete_directory(dir_name)
        self.plugins_dir_handler.remove_known_dir(dir_name)
        self.plugins_dir_handler.resume()
