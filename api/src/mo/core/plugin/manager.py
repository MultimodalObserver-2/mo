import json
import multiprocessing
import os
import sys
from typing import Any, Optional

from mo.core.config import constants
from mo.core.config.constants import APP_DATA_DIR, RELATIVE_PLUGINS_DIR_PATH
from mo.core.plugin.metadata_loader import load_plugin_metadata
from mo.core.plugin.models.plugin import Plugin, PluginMetadata
from mo.core.plugin.models.settings import Settings
from mo.core.plugin.worker_process import PluginProcessMetadata, PluginWorkerProcess
from mo.core.utils.singleton import singleton


@singleton
class PluginManager:
    """Manages the lifecycle of plugins in the application, and provides methods to manage them."""

    plugins_metadata: dict[str, PluginMetadata]
    plugin_processes_metadata: dict[str, PluginProcessMetadata]
    plugin_processes: dict[str, PluginWorkerProcess]
    plugin_types: dict[str, list[type[Plugin]]]
    plugin_types_to_check: list[type]

    def __init__(self):
        """Initializes the PluginManager with default values."""
        self.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.plugin_metadata_name = constants.PLUGIN_METADATA_FILE
        self.metadata_entry_points_name = "entryPoints"
        self.metadata_entry_points = {
            # Entry points for plugins, these are used to load specific functionalities
            "plugin": "mo.plugin",  # Main entry point for plugins
            # Entry point for plugin settings properties
            "properties": "mo.plugin.properties",
        }
        self.plugins_path = os.path.join(APP_DATA_DIR, self.plugins_dir)
        self.plugins_path = os.path.normpath(self.plugins_path)
        self.plugins_metadata = {}
        self.plugin_processes_metadata = {}
        self.plugin_processes = {}
        self.plugin_types = {}
        # Default plugin type to check for search purposes
        self.plugin_types_to_check = [Plugin]

    def _get_plugin_dir_path(self, dir_name: str) -> str:
        """Returns the absolute path to the plugin directory.
        Args:
            dir_name (str): The name of the plugin directory.
        """
        plugin_path = os.path.join(self.plugins_path, dir_name)
        plugin_path = os.path.normpath(plugin_path)
        return plugin_path

    def _get_plugin_metadata_path(self, dir_name: str) -> str:
        """Returns the absolute path to the plugin metadata file.
        Args:
            dir_name (str): The name of the plugin directory.
        """
        metadata_path = os.path.join(self.plugins_path, dir_name, self.plugin_metadata_name)
        metadata_path = os.path.normpath(metadata_path)
        return metadata_path

    def load_all_plugins(self) -> list[str]:
        """Loads all plugins from the plugins directory.
        Returns:
            list[str]: A list of successfully loaded plugin directory names.
        """
        dirs = []
        for plugin_dir_name in os.listdir(self.plugins_path):
            try:
                self.register_plugin(plugin_dir_name)
                dirs.append(plugin_dir_name)
            except Exception as e:
                print(f"ERROR: Failed to load plugin {plugin_dir_name}: {str(e)}")
                print(f"Traceback: {sys.exc_info()[1]}")
                continue
        return dirs

    def load_metadata_file(self, dir_name: str) -> dict[str, Any]:
        """Loads the metadata file for a plugin.
        Args:
            dir_name (str): The name of the plugin directory.
        Returns:
            dict[str, Any]: The metadata dictionary loaded from the plugin's metadata file.
        Raises:
            FileNotFoundError: If the metadata file does not exist.
        """
        metadata_path = self._get_plugin_metadata_path(dir_name)
        if not os.path.exists(metadata_path):
            raise FileNotFoundError(f"Metadata file not found at {metadata_path}")

        with open(metadata_path, "r") as f:
            data = json.load(f)

        return data

    def get_entry_point(self, dir_name: str, group: str) -> tuple[str, str] | None:
        """Gets the entry point for a specific group in the plugin metadata.
        Args:
            dir_name (str): The name of the plugin directory.
            group (str): The group for which to get the entry point.
        Returns:
            tuple[str, str] | None: A tuple containing the module path and symbol name if the entry point exists, otherwise None.
        """
        metadata_dict = self.load_metadata_file(dir_name)
        entry_points = metadata_dict.get(self.metadata_entry_points_name, {})
        if group not in entry_points:
            return None

        entry_point = entry_points[group]
        module_path, symbol_name = entry_point.split(":")
        module_path = module_path.replace(".", os.sep)
        module_path = module_path + ".py"
        return module_path, symbol_name

    def exists_entry_point(self, dir_name: str, group: str) -> bool:
        """Checks if an entry point for a specific group exists in the plugin metadata.
        Args:
            dir_name (str): The name of the plugin directory.
            group (str): The group for which to check the entry point.
        Returns:
            bool: True if the entry point exists, otherwise False.
        """
        metadata_dict = self.load_metadata_file(dir_name)
        entry_points = metadata_dict.get(self.metadata_entry_points_name, {})
        return group in entry_points

    def get_entry_points(self, dir_name: str) -> dict[str, str]:
        """Gets all entry points for a plugin.
        Args:
            dir_name (str): The name of the plugin directory.
        Returns:
            dict[str, str]: A dictionary of entry points where keys are group names and values are module paths.
        """
        metadata_dict = self.load_metadata_file(dir_name)
        entry_points = metadata_dict.get(self.metadata_entry_points_name, {})
        return entry_points

    def register_plugin(self, dir_name: str) -> PluginMetadata:
        """Registers a plugin by its directory name.
        Args:
            dir_name (str): The name of the plugin directory.
        Returns:
            PluginMetadata: The metadata of the registered plugin.
        Raises:
            ImportError: If the plugin is already loaded or not available on the current platform.
        """
        metadata_path = self._get_plugin_metadata_path(dir_name)
        plugin_metadata = load_plugin_metadata(metadata_path)
        plugin_metadata._location = self._get_plugin_dir_path(dir_name)
        if self.plugin_metadata_exists(plugin_metadata.get_final_id()):
            raise ImportError(f"Plugin '{plugin_metadata.name}' is already loaded")

        try:
            if not plugin_metadata.platform.is_available():
                raise ImportError(
                    f"Plugin '{plugin_metadata.name}' (v{str(plugin_metadata.version)}) is not available on this operating system"
                )
            status_queue = multiprocessing.Queue()
            plugin_process_metadata = PluginProcessMetadata(
                dir_name,
                plugin_metadata,
                self.get_entry_points(dir_name),
                status_queue,
                self.plugin_types_to_check,
            )
            plugin_process = PluginWorkerProcess(plugin_process_metadata, load_main_instance=True)
            plugin_process.start()
            status = status_queue.get()
            plugin_metadata._is_loaded = status.get("is_loaded", False)
            plugin_metadata._error = status.get("error", None)
            plugin_metadata._module = status.get("module_name", None)
            self.plugin_types[dir_name] = status.get("plugin_types", [])
            if plugin_metadata._is_loaded:
                self.plugin_processes_metadata[dir_name] = plugin_process_metadata
        except Exception as e:
            plugin_metadata._is_loaded = False
            plugin_metadata._error = str(e)

        self.plugins_metadata[dir_name] = plugin_metadata
        return plugin_metadata

    def remove_plugin_by_dir(self, dir_name: str) -> None:
        """Removes a plugin by its directory name.
        Args:
            dir_name (str): The name of the plugin directory.
        Raises:
            ValueError: If the plugin is not found in the registered plugins.
        """
        if dir_name not in self.plugins_metadata:
            raise ValueError(f"Plugin at {dir_name} not found in registered plugins")

        self.plugins_metadata.pop(dir_name)
        self.plugin_processes_metadata.pop(dir_name, None)
        plugin_process = self.plugin_processes.pop(dir_name, None)
        if plugin_process is not None and plugin_process.is_alive():
            plugin_process.terminate()

    def remove_plugin(self, final_id: str) -> str:
        """Removes a plugin by its final ID (publisher_id.plugin_id).
        Args:
            final_id (str): The final ID of the plugin to remove.
        Returns:
            str: The directory name of the removed plugin.
        Raises:
            ValueError: If the plugin is not found in the registered plugins.
        """
        dir_name = self._get_plugin_metadata_dir(final_id)
        if dir_name is None:
            raise ValueError(f"Plugin '{final_id}' not found in registered plugins")
        self.remove_plugin_by_dir(dir_name)
        return dir_name

    def rename_plugin_dir(self, new_dir_name: str):
        """Renames a plugin directory and updates its metadata.
        Args:
            new_dir_name (str): The new name for the plugin directory.
        Raises:
            ValueError: If the plugin is not found in the registered plugins.
        """
        metadata_path = self._get_plugin_metadata_path(new_dir_name)
        metadata = load_plugin_metadata(metadata_path)
        self.remove_plugin(metadata.name)
        self.register_plugin(new_dir_name)

    def get_all_plugins_metadata(self) -> list[PluginMetadata]:
        """Returns a list of all registered plugins' metadata.
        Returns:
            list[PluginMetadata]: A list of PluginMetadata objects for all registered plugins.
        """
        return list(self.plugins_metadata.values())

    def _get_plugin_metadata_dir(self, final_id: str) -> str | None:
        """Returns the directory name of the plugin metadata for a given plugin final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
        Returns:
            str | None: The directory name of the plugin metadata if found, otherwise None.
        """
        return next(
            (k for k, v in self.plugins_metadata.items() if v.is_plugin_from_final_id(final_id)),
            None,
        )

    def _get_plugin_process_metadata_dir(self, final_id: str) -> str | None:
        """Returns the directory name of the plugin process metadata for a given plugin final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
        Returns:
            str | None: The directory name of the plugin process metadata if found, otherwise None.
        """
        return next(
            (
                k
                for k, v in self.plugin_processes_metadata.items()
                if v.metadata.is_plugin_from_final_id(final_id)
            ),
            None,
        )

    def get_plugin_metadata(self, final_id: str) -> PluginMetadata | None:
        """Returns the metadata of a plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin.
        Returns:
            PluginMetadata | None: The PluginMetadata object if found, otherwise None.
        """
        key = self._get_plugin_metadata_dir(final_id)
        if key is not None:
            return self.plugins_metadata[key]
        return None

    def get_plugin_dir_name(self, final_id: str) -> str:
        """Returns the directory name of a plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
        Returns:
            str: The directory name of the plugin.
        Raises:
            ValueError: If the plugin is not found in the registered plugins.
        """
        for dir_name, plugin in self.plugins_metadata.items():
            if plugin.is_plugin_from_final_id(final_id):
                return dir_name
        raise ValueError(f"Plugin '{final_id}' not found in registered plugins")

    def get_plugin_process(self, final_id: str) -> PluginWorkerProcess | None:
        """Returns the worker process of a plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
        Returns:
            PluginWorkerProcess | None: The PluginWorkerProcess object if found, otherwise None.
        """
        key = self._get_plugin_process_metadata_dir(final_id)
        if key is None:
            return None
        return self.plugin_processes.get(key, None)

    def get_active_plugin_process(
        self, final_id: str, processes_queue: Optional[multiprocessing.Queue] = None
    ) -> PluginWorkerProcess | None:
        """Returns the active/running worker process of a plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
            processes_queue (Optional[multiprocessing.Queue]): A queue for managing processes, if provided.
        Returns:
            PluginWorkerProcess | None: The active PluginWorkerProcess object if found, otherwise None.
        """
        key = self._get_plugin_process_metadata_dir(final_id)
        if key is None:
            return None
        plugin_process = self.plugin_processes.get(key, None)
        if plugin_process is not None and plugin_process.is_alive() and processes_queue is None:
            # If the process is already running and the queue is None, return it
            # and set the timeout to None to leave it running indefinitely.
            plugin_process.set_timeout(None)
            return plugin_process

        process_metadata = self.plugin_processes_metadata.get(key)
        if process_metadata is None:
            return None
        plugin_process = PluginWorkerProcess(
            process_metadata, keep_running=True, processes_queue=processes_queue
        )
        self.plugin_processes[key] = plugin_process
        plugin_process.start()
        process_metadata.status_queue.get()
        plugin_process.set_timeout(None)
        return plugin_process

    def plugin_metadata_exists(self, final_id: str) -> bool:
        """Checks if a plugin metadata exists for a given final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
        Returns:
            bool: True if the plugin metadata exists, otherwise False.
        """
        return self.get_plugin_metadata(final_id) is not None

    def get_plugins_metadata_from_type(self, plugin_type: type) -> list[PluginMetadata]:
        """Returns a list of plugin metadata for a specific plugin type.
        Args:
            plugin_type (type): The type of the plugin to filter by.
        Returns:
            list[PluginMetadata]: A list of PluginMetadata objects that match the specified plugin type.
        """
        res = []
        for key in self.plugins_metadata.keys():
            if plugin_type in self.plugin_types.get(key, []):
                res.append(self.plugins_metadata[key])
        return res

    def get_plugin_properties(
        self, final_id: str, settings: Optional[Settings]
    ) -> list[dict[str, Any]] | None:
        """Returns the properties of a plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
            settings (Optional[Settings]): The settings to use for retrieving properties.
        Returns:
            list[dict[str, Any]] | None: A list of properties dictionaries if the plugin is found and properties are available, otherwise None.
        """
        key = self._get_plugin_metadata_dir(final_id)
        if key is None:
            return None

        process_metadata = self.plugin_processes_metadata.get(key)
        if process_metadata is None:
            return None

        plugin_process = self.plugin_processes.get(key)
        if plugin_process is None or not plugin_process.is_alive():
            plugin_process = PluginWorkerProcess(process_metadata, keep_running=True, timeout=120)
            self.plugin_processes[key] = plugin_process
            plugin_process.start()
            process_metadata.status_queue.get()

        properties = plugin_process.get_properties(settings)
        return properties

    def validate_plugin_settings(self, final_id: str, settings: Settings) -> None:
        """Validates the settings of a plugin by its final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
            settings (Settings): The settings to validate.
        Raises:
            ValueError: If the plugin is not found in the loaded plugins or running processes.
        """
        key = self._get_plugin_metadata_dir(final_id)
        if key is None:
            raise ValueError(f"Plugin '{final_id}' not found in loaded plugins")

        process_metadata = self.plugin_processes_metadata.get(key)
        if process_metadata is None:
            raise ValueError(f"Plugin '{final_id}' not found in running processes")

        plugin_process = self.plugin_processes.get(key)
        if plugin_process is None or not plugin_process.is_alive():
            plugin_process = PluginWorkerProcess(process_metadata, keep_running=True, timeout=120)
            self.plugin_processes[key] = plugin_process
            plugin_process.start()
            process_metadata.status_queue.get()

        # Validate the settings of the plugin, this will raise an error if the settings are invalid.
        plugin_process.validate_settings(settings)

    def plugin_from_type_exists(self, final_id: str, plugin_type: type) -> bool:
        """Checks if a plugin of a specific type exists for a given final ID.
        Args:
            final_id (str): The final ID of the plugin (publisher_id.plugin_id).
            plugin_type (type): The type of the plugin to check.
        Returns:
            bool: True if a plugin of the specified type exists with the given final ID, otherwise False.
        """
        for plugin_metadata in self.get_plugins_metadata_from_type(plugin_type):
            if plugin_metadata.is_plugin_from_final_id(final_id):
                return True
        return False

    def register_type_to_check(self, plugin_type: type) -> None:
        """Registers a plugin type to be checked for when loading plugins.
        Args:
            plugin_type (type): The type of the plugin to register.
        """
        if plugin_type not in self.plugin_types_to_check:
            self.plugin_types_to_check.append(plugin_type)
