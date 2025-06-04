import json
from multiprocessing import Queue
import multiprocessing
import os
import sys
from typing import Any, Optional

from api.core.config.constants import APP_DATA_DIR, RELATIVE_PLUGINS_DIR_PATH
from api.core.plugin.load_plugin_metadata import load_plugin_metadata
from api.core.plugin.plugin import Plugin, PluginMetadata
from api.core.plugin.plugin_worker_process import PluginProcessMetadata, PluginWorkerProcess
from api.core.plugin.settings import Settings
from api.core.utils.singleton import singleton


@singleton
class PluginManagement:
    plugins_metadata: dict[str, PluginMetadata]
    plugin_processes_metadata: dict[str, PluginProcessMetadata]
    plugin_processes: dict[str, PluginWorkerProcess]
    plugin_types: dict[str, list[type[Plugin]]]
    plugin_types_to_check: list[type]

    def __init__(self):
        self.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.plugin_metadata_name = "metadata.json"
        self.metadata_entry_points_name = "entryPoints"
        self.metadata_entry_points = {
            "plugin": "mo.plugin",
            "properties": "mo.plugin.properties",
        }
        self.plugins_path = os.path.join(APP_DATA_DIR, self.plugins_dir)
        self.plugins_path = os.path.normpath(self.plugins_path)
        self.plugins_metadata = {}
        self.plugin_processes_metadata = {}
        self.plugin_processes = {}
        self.plugin_types = {}
        self.plugin_types_to_check = [Plugin]


    def _get_plugin_dir_path(self, dir_name: str) -> str:
        plugin_path = os.path.join(self.plugins_path, dir_name)
        plugin_path = os.path.normpath(plugin_path)
        return plugin_path

    def _get_plugin_metadata_path(self, dir_name: str) -> str:
        metadata_path = os.path.join(
            self.plugins_path, dir_name, self.plugin_metadata_name)
        metadata_path = os.path.normpath(metadata_path)
        return metadata_path

    def load_all_plugins(self) -> list[str]:
        dirs = []
        for plugin_dir_name in os.listdir(self.plugins_path):
            try:
                self.register_plugin(plugin_dir_name)
                dirs.append(plugin_dir_name)
            except:
                print(f"ERROR: Failed to load plugin {plugin_dir_name}")
                print(f"Traceback: {sys.exc_info()[1]}")
                continue
        return dirs

    def load_metadata_file(self, dir_name: str) -> dict[str, Any]:
        metadata_path = self._get_plugin_metadata_path(dir_name)
        if not os.path.exists(metadata_path):
            raise FileNotFoundError(
                f"Metadata file not found at {metadata_path}")

        with open(metadata_path, "r") as f:
            data = json.load(f)

        return data

    def get_entry_point(self, dir_name: str, group: str):
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
        metadata_dict = self.load_metadata_file(dir_name)
        entry_points = metadata_dict.get(self.metadata_entry_points_name, {})
        return group in entry_points

    def get_entry_points(self, dir_name: str) -> dict[str, str]:
        metadata_dict = self.load_metadata_file(dir_name)
        entry_points = metadata_dict.get(self.metadata_entry_points_name, {})
        return entry_points

    def register_plugin(self, dir_name: str) -> PluginMetadata:
        metadata_path = self._get_plugin_metadata_path(dir_name)
        plugin_metadata = load_plugin_metadata(metadata_path)
        plugin_metadata._location = self._get_plugin_dir_path(dir_name)
        if self.plugin_metadata_exists(plugin_metadata.get_final_id()):
            raise ImportError(
                f"Plugin '{plugin_metadata.name}' is already loaded")
        
        try:
            if not plugin_metadata.platform.is_available():
                raise ImportError(
                    f"Plugin '{plugin_metadata.name}' (v{str(plugin_metadata.version)}) is not available on this operating system"
                )
            status_queue = Queue()
            plugin_process_metadata = PluginProcessMetadata(
                dir_name, plugin_metadata, self.get_entry_points(dir_name), status_queue, self.plugin_types_to_check)
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
        if dir_name not in self.plugins_metadata:
            raise ValueError(
                f"Plugin at {dir_name} not found in registered plugins")

        self.plugins_metadata.pop(dir_name)
        self.plugin_processes_metadata.pop(dir_name, None)
        plugin_process = self.plugin_processes.pop(dir_name, None)
        if plugin_process is not None and plugin_process.is_alive():
            plugin_process.terminate()

    def remove_plugin(self, final_id: str) -> str:
        dir_name = self._get_plugin_metadata_dir(final_id)
        if dir_name is None:
            raise ValueError(f"Plugin '{final_id}' not found in registered plugins")
        self.remove_plugin_by_dir(dir_name)
        return dir_name

    def rename_plugin_dir(self, new_dir_name: str):
        metadata_path = self._get_plugin_metadata_path(new_dir_name)
        metadata = load_plugin_metadata(metadata_path)
        self.remove_plugin(metadata.name)
        self.register_plugin(new_dir_name)

    def get_all_plugins_metadata(self) -> list[PluginMetadata]:
        return list(self.plugins_metadata.values())

    def _get_plugin_metadata_dir(self, final_id: str) -> str | None:
        return next((k for k, v in self.plugins_metadata.items() if v.is_plugin_from_final_id(final_id)), None)

    def _get_plugin_process_metadata_dir(self, final_id: str) -> str | None:
        return next((k for k, v in self.plugin_processes_metadata.items() if v.metadata.is_plugin_from_final_id(final_id)), None)

    def get_plugin_metadata(self, final_id: str) -> PluginMetadata | None:
        key = self._get_plugin_metadata_dir(final_id)
        if key is not None:
            return self.plugins_metadata[key]
        return None

    def get_plugin_dir_name(self, final_id: str) -> str:
        for dir_name, plugin in self.plugins_metadata.items():
            if plugin.is_plugin_from_final_id(final_id):
                return dir_name
        raise ValueError(f"Plugin '{final_id}' not found in registered plugins")

    def get_plugin_process(self, final_id: str) -> PluginWorkerProcess | None:
        key = self._get_plugin_process_metadata_dir(final_id)
        if key is None:
            return None
        return self.plugin_processes.get(key, None)
    
    def get_active_plugin_process(self, final_id: str, processes_queue: Optional[multiprocessing.Queue] = None) -> PluginWorkerProcess | None:
        key = self._get_plugin_process_metadata_dir(final_id)
        if key is None:
            return None
        plugin_process = self.plugin_processes.get(key, None)
        if plugin_process is None or not plugin_process.is_alive():
            process_metadata = self.plugin_processes_metadata.get(key)
            if process_metadata is None:
                return None
            plugin_process = PluginWorkerProcess(process_metadata, keep_running=True, processes_queue=processes_queue)
            self.plugin_processes[key] = plugin_process
            plugin_process.start()
            process_metadata.status_queue.get()
        plugin_process.set_timeout(None)
        return plugin_process

    def plugin_metadata_exists(self, final_id: str) -> bool:
        return self.get_plugin_metadata(final_id) is not None

    def get_plugins_metadata_from_type(self, plugin_type: type) -> list[PluginMetadata]:
        res = []
        for key in self.plugins_metadata.keys():
            if plugin_type in self.plugin_types.get(key, []):
                res.append(self.plugins_metadata[key])
        return res

    def get_plugin_properties(self, final_id: str, settings: Optional[Settings]) -> list[dict[str, Any]] | None:
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

    def validate_plugin_properties(self, final_id: str, settings: Settings) -> None:
        key = self._get_plugin_metadata_dir(final_id)
        if key is None:
            raise ValueError(
                f"Plugin '{final_id}' not found in loaded plugins")

        process_metadata = self.plugin_processes_metadata.get(key)
        if process_metadata is None:
            raise ValueError(f"Plugin '{final_id}' not found in running processes")


        plugin_process = self.plugin_processes.get(key)
        if plugin_process is None or not plugin_process.is_alive():
            plugin_process = PluginWorkerProcess(process_metadata, keep_running=True, timeout=120)
            self.plugin_processes[key] = plugin_process
            plugin_process.start()
            process_metadata.status_queue.get()
            
        plugin_process.validate_properties(settings)

    def plugin_from_type_exists(self, final_id: str, plugin_type: type) -> bool:
        for plugin_metadata in self.get_plugins_metadata_from_type(plugin_type):
            if plugin_metadata.is_plugin_from_final_id(final_id):
                return True
        return False
    
    def register_type_to_check(self, plugin_type: type) -> None:
        if plugin_type not in self.plugin_types_to_check:
            self.plugin_types_to_check.append(plugin_type)
