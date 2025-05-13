from api.core.config.constants import RELATIVE_PLUGINS_DIR_PATH
from api.core.file_management.file_management import FileManagement
from api.core.plugin.plugin_management import PluginManagement
from api.core.plugin.plugins_dir_observer import PluginsDirHandler
from api.core.plugin.schemas.plugin import PluginRes
from api.core.utils.http_exceptions import BadRequestException
from fastapi import UploadFile


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
        dir_name = self.file_management.get_unique_name(
            file_name.replace(".zip", ""))

        dir_path = self.file_management.create_directory(dir_name)
        zip_path = self.file_management.copy_file_obj(
            file.file, dir_name, dir_path)
        self.file_management.extract_zip(zip_path, dir_path)
        self.file_management.delete_file(zip_path)
        try:
            self.plugin_management.add_plugin(dir_name)
        except Exception as e:
            self.file_management.delete_directory(dir_name)
            raise BadRequestException(
                f"Failed to add plugin {file_name}. Error: {e}")
        self.plugins_dir_handler.add_known_dir(dir_name)
        self.plugins_dir_handler.resume()
        plugin_instance = self.plugin_management.get_plugin(dir_name)
        plugin_dict = {
            "name": plugin_instance.name,
            "version": str(plugin_instance.version),
            "description": plugin_instance.description,
            "repository": plugin_instance.repo,
            "author": plugin_instance.author or "",
            "author_email": plugin_instance.author_email or "",
            "platforms": plugin_instance.platform.get_platforms(),
            "module": plugin_instance._module,
            "location": dir_path,
        }
        return PluginRes(**plugin_dict)
