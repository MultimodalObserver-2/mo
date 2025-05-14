import importlib
import importlib.util
import json
import os
import sys
from types import ModuleType

from api.core.config.constants import APP_DATA_DIR, RELATIVE_PLUGINS_DIR_PATH
from api.core.plugin.plugin import Plugin


class PluginManagement:
    _instance = None

    def __init__(self):
        self.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.plugin_metadata_name = "metadata.json"
        self.plugin_default_name = "main.py"
        self.plugins_path = os.path.join(APP_DATA_DIR, self.plugins_dir)
        self.plugins_path = os.path.normpath(self.plugins_path)
        self.plugins = {} # type: dict[str, Plugin]
        pass

    def __new__(cls):
        """Singleton class."""
        if cls._instance is None:
            cls._instance = super(PluginManagement, cls).__new__(cls)
        return cls._instance

    def _get_plugin_dir_path(self, plugin_name: str) -> str:
        plugin_path = os.path.join(self.plugins_path, plugin_name)
        plugin_path = os.path.normpath(plugin_path)
        return plugin_path

    def _get_plugin_metadata_path(self, plugin_name: str) -> str:
        metadata_path = os.path.join(self.plugins_path, plugin_name, self.plugin_metadata_name)
        metadata_path = os.path.normpath(metadata_path)
        return metadata_path

    def _get_plugin_default_path(self, plugin_name: str) -> str:
        default_path = os.path.join(self.plugins_path, plugin_name, self.plugin_default_name)
        default_path = os.path.normpath(default_path)
        return default_path

    def load_all_plugins(self):
        for plugin_dir_name in os.listdir(self.plugins_path):
            try:
                self.add_plugin(plugin_dir_name)
            except:
                print(f"ERROR: Failed to load plugin {plugin_dir_name}")
                print(f"Traceback: {sys.exc_info()[1]}")
                continue

    def load_plugin(self, dir_name: str) -> ModuleType:
        metadata_path = self._get_plugin_metadata_path(dir_name)

        class_dir_path = self._get_plugin_dir_path(dir_name)
        class_file_name = self.plugin_default_name
        if os.path.exists(metadata_path):
            with open(metadata_path, "r") as f:
                data = json.load(f)

            if data.get("class_dir_path"):
                class_dir_path = class_dir_path + "/" + data.get("class_dir_path")
                class_dir_path = os.path.normpath(class_dir_path)

            if data.get("class_file_name"):
                class_file_name = data.get("class_file_name")

        file_path = os.path.join(class_dir_path, class_file_name)
        file_path = os.path.normpath(file_path)
        if not os.path.exists(file_path):
            raise ImportError(f"Cannot find plugin at {dir_name}")

        spec = importlib.util.spec_from_file_location(dir_name, file_path)
        if spec is None:
            raise ImportError(f"Cannot import plugin at {dir_name}")

        if spec.loader is None:
            raise ImportError(f"Cannot load plugin at {dir_name}")

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
            raise ImportError(f"No plugin classes found in {loaded_module.__name__}")
        if len(instances) > 1:
            raise ImportError(
                f"Multiple plugin classes found in {loaded_module.__name__} - {instances}"
            )
        return instances[0]

    def add_plugin(self, dir_name: str):
        module = self.load_plugin(dir_name)
        instance = self.get_plugin_instance_from_module(module)
        if not instance.platform.is_available():
            raise ImportError(f"Plugin {dir_name} is not available on this platform")
        if self.get_plugin_by_name_and_version(instance.name, str(instance.version)):
            raise ImportError(
                f"Plugin {instance.name} version {instance.version} is already loaded"
            )
        instance.load()
        instance._location = self._get_plugin_dir_path(dir_name)
        self.plugins[dir_name] = instance

    def remove_plugin(self, dir_name: str):
        if dir_name not in self.plugins:
            raise ValueError(f"Plugin {dir_name} not found")
        instance = self.plugins[dir_name]
        instance.unload()
        del self.plugins[dir_name]
        self.plugins.pop(dir_name, None)

    def remove_plugin_by_name_and_version(self, name: str, version: str) -> str:
        for dir_name, instance in list(self.plugins.items()):
            if instance.name == name and str(instance.version) == version:
                self.remove_plugin(dir_name)
                return dir_name
        raise ValueError(f"Plugin {name} version {version} not found")

    def rename_plugin_dir(self, old_dir_name: str, new_dir_name: str):
        if old_dir_name not in self.plugins:
            raise ValueError(f"Plugin {old_dir_name} not found")
        instance = self.plugins[old_dir_name]
        instance.unload()
        del self.plugins[old_dir_name]
        self.plugins[new_dir_name] = instance
        instance.load()

    def get_plugin(self, dir_name: str) -> Plugin:
        if dir_name not in self.plugins:
            raise ValueError(f"Plugin {dir_name} not found")
        return self.plugins[dir_name]

    def get_all_plugins(self) -> list[Plugin]:
        return list(self.plugins.values())

    def get_plugin_by_name_and_version(
        self, name: str, version: str
    ) -> Plugin | None:
        for plugin in self.plugins.values():
            if plugin.name == name and str(plugin.version) == version:
                return plugin
        return None
