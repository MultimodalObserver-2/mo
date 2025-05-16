from csv import Error
import importlib
import importlib.util
import json
import os
import sys
from types import ModuleType

from api.core.config.constants import APP_DATA_DIR, RELATIVE_PLUGINS_DIR_PATH
from api.core.plugin import plugin
from api.core.plugin.load_plugin_metadata import load_plugin_metadata
from api.core.plugin.plugin import Plugin, PluginMetadata
from api.core.utils.singleton import singleton


@singleton
class PluginManagement:
    def __init__(self):
        self.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.plugin_metadata_name = "metadata.json"
        self.plugin_default_name = "main.py"
        self.plugins_path = os.path.join(APP_DATA_DIR, self.plugins_dir)
        self.plugins_path = os.path.normpath(self.plugins_path)
        self.loaded_plugins = {}  # type: dict[str, Plugin]
        self.plugins_metadata = {}  # type: dict[str, PluginMetadata]

    def _get_plugin_dir_path(self, plugin_name: str) -> str:
        plugin_path = os.path.join(self.plugins_path, plugin_name)
        plugin_path = os.path.normpath(plugin_path)
        return plugin_path

    def _get_plugin_metadata_path(self, plugin_name: str) -> str:
        metadata_path = os.path.join(
            self.plugins_path, plugin_name, self.plugin_metadata_name)
        metadata_path = os.path.normpath(metadata_path)
        return metadata_path

    def _get_plugin_default_path(self, plugin_name: str) -> str:
        default_path = os.path.join(
            self.plugins_path, plugin_name, self.plugin_default_name)
        default_path = os.path.normpath(default_path)
        return default_path

    def load_all_plugins(self) -> list[str]:
        dirs = []
        for plugin_dir_name in os.listdir(self.plugins_path):
            try:
                self.add_plugin(plugin_dir_name)
                dirs.append(plugin_dir_name)
            except:
                print(f"ERROR: Failed to load plugin {plugin_dir_name}")
                print(f"Traceback: {sys.exc_info()[1]}")
                continue
        return dirs

    def load_class_metadata(self, path: str) -> dict:
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Metadata file not found at {path}")

        with open(path, "r") as f:
            data = json.load(f)
            class_metadata = data.get("class")
            return class_metadata

    def load_plugin(self, dir_name: str) -> ModuleType:
        metadata_path = self._get_plugin_metadata_path(dir_name)
        class_dir_path = self._get_plugin_dir_path(dir_name)
        class_file_name = self.plugin_default_name

        class_metadata = self.load_class_metadata(metadata_path)
        if class_metadata["dir_path"]:
            class_dir_path = os.path.join(
                class_dir_path, class_metadata["dir_path"])
            class_dir_path = os.path.normpath(class_dir_path)
        if class_metadata["file_name"]:
            class_file_name = class_metadata["file_name"]

        file_path = os.path.join(class_dir_path, class_file_name)
        file_path = os.path.normpath(file_path)
        rel_path = os.path.join(class_metadata["dir_path"], class_file_name)
        if not os.path.exists(file_path):
            raise ImportError(
                f"Cannot find plugin at {dir_name}: {rel_path}")

        spec = importlib.util.spec_from_file_location(dir_name, file_path)
        if spec is None:
            raise ImportError(
                f"Cannot import plugin at {dir_name}: {rel_path}")

        if spec.loader is None:
            raise ImportError(f"Cannot load plugin at {dir_name}: {rel_path}")

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module

    def get_plugin_instance_from_module(self, loaded_module: ModuleType) -> Plugin:
        instances = []
        for attr_name in dir(loaded_module):
            attr = getattr(loaded_module, attr_name)
            if isinstance(attr, type) and issubclass(attr, Plugin) and attr is not Plugin:
                instances.append(attr())

        if len(instances) == 0:
            raise ImportError(
                f"No plugin classes found in {loaded_module.__name__}")
        if len(instances) > 1:
            raise ImportError(
                f"Multiple plugin classes found in {loaded_module.__name__} - {instances}"
            )
        return instances[0]

    def add_plugin(self, dir_name: str) -> PluginMetadata:
        metadata_path = self._get_plugin_metadata_path(dir_name)
        plugin_metadata = load_plugin_metadata(metadata_path)
        plugin_metadata._location = self._get_plugin_dir_path(dir_name)
        if self.plugin_metadata_exists(plugin_metadata.name, str(plugin_metadata.version)):
            raise ImportError(
                f"Plugin '{plugin_metadata.name}' (v{plugin_metadata.version}) is already loaded"
            )

        try:
            if not plugin_metadata.platform.is_available():
                raise ImportError(
                    f"Plugin '{plugin_metadata.name}' (v{str(plugin_metadata.version)}) is not available on this operating system")
            module = self.load_plugin(dir_name)
            instance = self.get_plugin_instance_from_module(module)
            instance.load()
            instance.metadata._location = self._get_plugin_dir_path(dir_name)
            instance.metadata._module = instance._module
            instance.metadata._is_loaded = True
            plugin_metadata._module = instance._module
            plugin_metadata._is_loaded = True
            self.loaded_plugins[dir_name] = instance
        except Exception as e:
            plugin_metadata._error = str(e)

        self.plugins_metadata[dir_name] = plugin_metadata
        return plugin_metadata

    def remove_plugin_by_dir(self, dir_name: str) -> None:
        if dir_name not in self.plugins_metadata:
            raise ValueError(
                f"Plugin at {dir_name} not found in loaded plugins")
        if dir_name not in self.loaded_plugins:
            self.plugins_metadata.pop(dir_name)
            return

        plugin = self.loaded_plugins[dir_name]
        plugin.unload()
        del plugin
        self.loaded_plugins.pop(dir_name)
        self.plugins_metadata.pop(dir_name)

    def remove_plugin(self, name: str, version: str) -> str:
        dir_name = self._get_plugin_metadata_dir(name, version)
        if dir_name is None:
            raise ValueError(
                f"Plugin '{name}' (v{version}) not found in loaded plugins")
        self.remove_plugin_by_dir(dir_name)
        return dir_name

    def rename_plugin_dir(self, new_dir_name: str):
        metadata_path = self._get_plugin_metadata_path(new_dir_name)
        metadata = load_plugin_metadata(metadata_path)
        self.remove_plugin(metadata.name, str(metadata.version))
        self.add_plugin(new_dir_name)

    def get_all_plugins(self) -> list[Plugin]:
        return list(self.loaded_plugins.values())

    def get_all_plugins_metadata(self) -> list[PluginMetadata]:
        return list(self.plugins_metadata.values())

    def _get_plugin_metadata_dir(self, name: str, version: str) -> str | None:
        return next((k for k, v in self.plugins_metadata.items() if v.name == name and str(v.version) == version), None)

    def get_plugin_metadata(self, name: str, version: str) -> PluginMetadata | None:
        key = self._get_plugin_metadata_dir(name, version)
        if key is not None:
            return self.plugins_metadata[key]
        return None

    def _get_plugin_dir(self, name: str, version: str) -> str | None:
        return next((k for k, v in self.loaded_plugins.items() if v.metadata.name == name and str(v.metadata.version) == version), None)

    def get_plugin(self, name: str, version: str) -> Plugin | None:
        key = self._get_plugin_dir(name, version)
        if key is not None:
            return self.loaded_plugins[key]
        return None

    def plugin_exists(self, name: str, version: str) -> bool:
        return self.get_plugin(name, version) is not None
    
    def plugin_metadata_exists(self, name: str, version: str) -> bool:
        return self.get_plugin_metadata(name, version) is not None