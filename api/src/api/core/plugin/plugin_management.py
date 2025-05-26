import importlib
import importlib.util
import json
import os
import sys
from typing import Any

from api.core.config.constants import APP_DATA_DIR, RELATIVE_PLUGINS_DIR_PATH
from api.core.plugin.load_plugin_metadata import load_plugin_metadata
from api.core.plugin.plugin import Plugin, PluginMetadata
from api.core.plugin.properties import Properties
from api.core.plugin.settings import Settings
from api.core.utils.singleton import singleton


@singleton
class PluginManagement:
    plugins: dict[str, type[Plugin]]
    plugins_instances: dict[str, Plugin]
    plugins_metadata: dict[str, PluginMetadata]
    plugins_properties: dict[str, Properties]

    def __init__(self):
        self.plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.dependencies_name = "dependencies"
        self.plugin_metadata_name = "metadata.json"
        self.metadata_entry_points_name = "entry_points"
        self.metadata_entry_points = {
            "plugin": "mo.plugin",
            "properties": "mo.plugin.properties",
        }
        self.plugins_path = os.path.join(APP_DATA_DIR, self.plugins_dir)
        self.plugins_path = os.path.normpath(self.plugins_path)
        self.plugins = {}
        self.plugins_instances = {}
        self.plugins_metadata = {}
        self.plugins_properties = {}

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

    def load_dependencies(self, dir_name: str) -> None:
        dependencies_path = os.path.join(
            self._get_plugin_dir_path(dir_name), self.dependencies_name)
        if os.path.exists(dependencies_path):
            sys.path.append(dependencies_path)

    def load_symbol(self, dir_name: str, group: str) -> Any | None:
        entry_point = self.get_entry_point(dir_name, group)
        if entry_point is None:
            return None
        module_path, symbol_name = entry_point
        full_module_path = os.path.join(
            self._get_plugin_dir_path(dir_name), module_path)
        full_module_path = os.path.normpath(full_module_path)
        if not os.path.exists(full_module_path):
            raise FileNotFoundError(f"Module file not found at {module_path}")

        self.load_dependencies(dir_name)

        spec = importlib.util.spec_from_file_location(
            dir_name, full_module_path)
        if spec is None or spec.loader is None:
            return None

        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return getattr(module, symbol_name)

    def load_plugin(self, dir_name: str) -> type[Plugin]:
        entry_point = self.get_entry_point(
            dir_name, self.metadata_entry_points["plugin"])
        if entry_point is None:
            raise ImportError(
                f"Plugin '{dir_name}' does not have an entry point defined")
        module_path, symbol_name = entry_point

        symbol = self.load_symbol(
            dir_name, self.metadata_entry_points["plugin"])
        if (
            symbol is None
            or not isinstance(symbol, type)
            or not issubclass(symbol, Plugin)
            or symbol is Plugin
        ):
            raise ImportError(
                f"Cannot load plugin at {dir_name}: {module_path} for class {symbol_name}"
            )

        return symbol

    def load_properties(self, dir_name: str) -> Properties | None:
        entry_point = self.get_entry_point(
            dir_name, self.metadata_entry_points["properties"])
        if entry_point is None:
            return None

        module_path, symbol_name = entry_point
        symbol = self.load_symbol(
            dir_name, self.metadata_entry_points["properties"])
        if symbol is None:
            raise ImportError(
                f"Cannot load properties at {dir_name}: {module_path} for class {symbol_name}"
            )

        if callable(symbol):
            instance = symbol()
        else:
            instance = symbol

        if not isinstance(instance, Properties):
            raise ImportError(
                f"Cannot load plugin properties at {dir_name}: {module_path} for class {symbol_name}"
            )

        return instance

    def register_plugin(self, dir_name: str) -> PluginMetadata:
        metadata_path = self._get_plugin_metadata_path(dir_name)
        plugin_metadata = load_plugin_metadata(metadata_path)
        plugin_metadata._location = self._get_plugin_dir_path(dir_name)
        if self.plugin_metadata_exists(plugin_metadata.name):
            raise ImportError(
                f"Plugin '{plugin_metadata.name}' is already loaded")

        try:
            if not plugin_metadata.platform.is_available():
                raise ImportError(
                    f"Plugin '{plugin_metadata.name}' (v{str(plugin_metadata.version)}) is not available on this operating system"
                )
            plugin = self.load_plugin(dir_name)
            self.plugins[dir_name] = plugin
            plugin_metadata._module = plugin._module
            instance = plugin()
            properties = self.load_properties(dir_name)
            if properties is not None:
                self.plugins_properties[dir_name] = properties
                instance.configure(Settings(properties.get_default_values()))
            instance.load()
            instance.metadata._location = self._get_plugin_dir_path(dir_name)
            instance.metadata._module = instance._module
            instance.metadata._is_loaded = True
            plugin_metadata._is_loaded = True
            self.plugins_instances[dir_name] = instance

        except Exception as e:
            plugin_metadata._error = str(e)

        self.plugins_metadata[dir_name] = plugin_metadata
        return plugin_metadata

    def remove_plugin_by_dir(self, dir_name: str) -> None:
        if dir_name not in self.plugins_metadata:
            raise ValueError(
                f"Plugin at {dir_name} not found in loaded plugins")
        if dir_name not in self.plugins_instances:
            self.plugins_metadata.pop(dir_name)
            return

        plugin = self.plugins_instances[dir_name]
        plugin.unload()
        del plugin
        self.plugins.pop(dir_name)
        self.plugins_instances.pop(dir_name)
        self.plugins_metadata.pop(dir_name)
        self.plugins_properties.pop(dir_name, None)

    def remove_plugin(self, name: str) -> str:
        dir_name = self._get_plugin_metadata_dir(name)
        if dir_name is None:
            raise ValueError(f"Plugin '{name}' not found in loaded plugins")
        self.remove_plugin_by_dir(dir_name)
        return dir_name

    def rename_plugin_dir(self, new_dir_name: str):
        metadata_path = self._get_plugin_metadata_path(new_dir_name)
        metadata = load_plugin_metadata(metadata_path)
        self.remove_plugin(metadata.name)
        self.register_plugin(new_dir_name)

    def get_all_plugins(self) -> list[type[Plugin]]:
        return list(self.plugins.values())

    def get_all_plugins_metadata(self) -> list[PluginMetadata]:
        return list(self.plugins_metadata.values())

    def _get_plugin_metadata_dir(self, name: str) -> str | None:
        return next((k for k, v in self.plugins_metadata.items() if v.name == name), None)

    def get_plugin_metadata(self, name: str) -> PluginMetadata | None:
        key = self._get_plugin_metadata_dir(name)
        if key is not None:
            return self.plugins_metadata[key]
        return None

    def _get_plugin_dir(self, name: str) -> str | None:
        return next((k for k, v in self.plugins_instances.items() if v.metadata.name == name), None)

    def get_plugin(self, name: str) -> type[Plugin] | None:
        key = self._get_plugin_dir(name)
        if key is not None:
            return self.plugins[key]
        return None

    def plugin_exists(self, name: str) -> bool:
        return self.get_plugin(name) is not None

    def plugin_metadata_exists(self, name: str) -> bool:
        return self.get_plugin_metadata(name) is not None

    def get_plugin_properties(self, name: str) -> Properties | None:
        key = self._get_plugin_metadata_dir(name)
        if key is not None:
            return self.plugins_properties.get(key, None)
        return None

    def get_plugins_from_type(self, plugin_type: type) -> list[type[Plugin]]:
        return [plugin for plugin in self.plugins.values() if issubclass(plugin, plugin_type)]

    def plugin_from_type_exists(self, name: str, plugin_type: type) -> bool:
        return any(
            plugin.metadata.name == name and issubclass(plugin, plugin_type)
            for plugin in self.plugins.values()
        )
