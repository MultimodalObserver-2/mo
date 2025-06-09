
from dataclasses import dataclass
import importlib
import importlib.util
from multiprocessing import Pipe, Process, Queue
from multiprocessing.connection import PipeConnection
import os
import sys
import time
from typing import Any, Callable, Optional

from mo.core.config.constants import APP_DATA_DIR, RELATIVE_PLUGINS_DIR_PATH
from mo.core.plugin.models.plugin import Plugin, PluginMetadata
from mo.core.plugin.models.properties import Properties
from mo.core.plugin.models.settings import Settings
from mo.core.utils.exceptions import UnknownError


@dataclass
class PluginProcessMetadata:
    dir_name: str
    metadata: PluginMetadata
    entry_points: dict[str, str]
    status_queue: Queue
    check_types: list[type]
    initial_settings: Optional[Settings] = None


execute_callback = Callable[[
    Plugin, Optional[dict[str, Any]], Optional[Queue], PluginProcessMetadata], Any]


class PluginWorkerProcess(Process):
    plugin_dir_path: str
    plugin_class: type[Plugin] | None
    process_metadata: PluginProcessMetadata
    properties: Properties
    _parent_conn: PipeConnection
    _child_conn: PipeConnection
    plugins_instances: dict[str, Plugin]
    plugins_instances_ids: list[str]
    load_main_instance: bool
    keep_running: bool
    timeout: Optional[float | int]
    processes_queue: Optional[Queue] = None
    METADATA_ENTRY_POINTS = {
        "plugin": "mo.plugin",
        "properties": "mo.plugin.properties",
    }

    def __init__(self, process_metadata: PluginProcessMetadata, load_main_instance: bool = False, keep_running: bool = False, timeout: Optional[float | int] = None, processes_queue: Optional[Queue] = None):
        super().__init__()
        dependencies_name = "dependencies"
        plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        plugins_path = os.path.join(APP_DATA_DIR, plugins_dir)
        plugins_path = os.path.normpath(plugins_path)
        self.plugin_dir_path = os.path.join(
            plugins_path, process_metadata.dir_name)
        self.plugin_dir_path = os.path.normpath(self.plugin_dir_path)
        self.plugin_dependencies_path = os.path.join(
            self.plugin_dir_path, dependencies_name)
        self.process_metadata = process_metadata
        self._parent_conn, self._child_conn = Pipe()
        self.plugin_class = None
        self.load_main_instance = load_main_instance
        self.keep_running = keep_running
        self.timeout = timeout
        self.plugins_instances = {}
        self.plugins_instances_ids = []
        self.processes_queue = processes_queue
        self.command_handlers = {
            "get_properties": self._handle_get_properties,
            "validate_settings": self._handle_validate_settings,
            "add_plugin_instance": self._handle_add_plugin_instance,
            "execute_callback_on_instance": self._handle_execute_callback_on_instance,
            "set_timeout": self._handle_set_timeout,
            "stop": self._handle_stop,
            "remove_plugin_instance": self._handle_remove_plugin_instance,
        }

    def run(self) -> None:
        try:
            self.plugin_class = self.__load_plugin()
            instance = self.plugin_class()
            properties = self.__load_properties()
            load_status = {}
            if properties is not None:
                self.properties = properties
                load_status["properties"] = properties.get_properties_dict(
                    self.process_metadata.initial_settings)
                if self.process_metadata.initial_settings is not None:
                    instance.configure(self.process_metadata.initial_settings)
            if self.load_main_instance:
                instance.load()
            plugin_types = []
            for plugin_type in self.process_metadata.check_types:
                if issubclass(self.plugin_class, plugin_type):
                    plugin_types.append(plugin_type)
            self.process_metadata.check_types = plugin_types
            load_status["is_loaded"] = True
            load_status["plugin_types"] = plugin_types
            load_status["module_name"] = self.plugin_class._module_name
            self.process_metadata.status_queue.put(load_status)
        except Exception as e:
            load_status = {
                "is_loaded": False,
                "error": str(e)
            }
            self.process_metadata.status_queue.put(load_status)
            return

        self._event_loop()

        if self.load_main_instance:
            instance.unload()
        self._child_conn.close()

    def _event_loop(self) -> None:
        last_activity_time = time.time()
        while self.keep_running:
            if self.timeout and (time.time() - last_activity_time > self.timeout):
                self.keep_running = False
                break
            if self._child_conn.poll(0.01):
                command, *args = self._child_conn.recv()
                try:
                    result = self.handle_command(command, *args)
                    if result is not None:
                        self._child_conn.send(result)
                except Exception as e:
                    self._child_conn.send({"is_ok": False, "exception": e})
                last_activity_time = time.time()

    def handle_command(self, command: str, *args: Any) -> Any:
        handler = self.command_handlers.get(command)
        if handler:
            return handler(*args)
        return None

    def _handle_get_properties(self, settings: Optional[Settings] = None) -> list[dict[str, Any]]:
        return self.properties.get_properties_dict(settings)

    def _handle_validate_settings(self, settings: Optional[Settings] = None) -> dict[str, Any]:
        try:
            self.properties.validate(settings or Settings())
            return {"is_valid": True}
        except Exception as e:
            return {"is_valid": False, "exception": e}

    def _handle_add_plugin_instance(self, instance_id: str, settings: Optional[Settings]) -> dict[str, bool]:
        if instance_id in self.plugins_instances:
            raise ValueError(
                f"Plugin instance with id '{instance_id}' already exists.")
        if self.plugin_class is None:
            raise RuntimeError("Plugin class is not loaded.")
        plugin_instance = self.plugin_class()
        plugin_instance.load()
        plugin_instance.configure(settings or Settings())
        self.plugins_instances[instance_id] = plugin_instance
        self.plugins_instances_ids.append(instance_id)
        return {"is_ok": True}
    
    def _handle_remove_plugin_instance(self, instance_id: str) -> dict[str, bool]:
        if instance_id not in self.plugins_instances:
            raise ValueError(
                f"Plugin instance with id '{instance_id}' does not exist.")
        plugin_instance = self.plugins_instances.pop(instance_id)
        plugin_instance.unload()
        self.plugins_instances_ids.remove(instance_id)
        return {"is_ok": True}

    def _handle_execute_callback_on_instance(self, instance_id: str, callback: execute_callback, extra_args: Optional[dict[str, Any]], need_response: bool) -> Optional[dict[str, Any]]:
        try:
            result = self._execute_callback_on_instance(
                instance_id, callback, extra_args)
            if need_response:
                return {"is_ok": True, "result": result}
        except Exception as e:
            if need_response:
                raise e
        return None

    def _handle_set_timeout(self, new_timeout: float | int | None) -> None:
        self.timeout = new_timeout

    def _handle_stop(self) -> dict[str, bool]:
        self.keep_running = False
        return {"is_ok": True}

    def stop(self, timeout: Optional[float] = None, force: bool = False) -> None:
        self._parent_conn.send(("stop",))
        res = self._parent_conn.recv()
        if not res.get("is_ok", False):
            exception = res.get("exception", UnknownError())
            raise exception
        self._parent_conn.close()
        if timeout is None and force:
            self.terminate()
        self.join(timeout)
        if force and self.is_alive():
            self.terminate()
            self.join()

    def validate_settings(self, settings: Optional[Settings]) -> None:
        self._parent_conn.send(("validate_settings", settings))
        res = self._parent_conn.recv()
        if not res.get("is_valid", False):
            exception = res.get("exception", UnknownError())
            raise exception

    def add_plugin_instance(self, instance_id: str, settings: Optional[Settings] = None) -> None:
        self._parent_conn.send(("add_plugin_instance", instance_id, settings))
        res = self._parent_conn.recv()
        if not res.get("is_ok", False):
            exception = res.get("exception", UnknownError())
            raise exception
        self.plugins_instances_ids.append(instance_id)

    def remove_plugin_instance(self, instance_id: str) -> None:
        self._parent_conn.send(("remove_plugin_instance", instance_id))
        res = self._parent_conn.recv()
        if not res.get("is_ok", False):
            exception = res.get("exception", UnknownError())
            raise exception
        if instance_id in self.plugins_instances_ids:
            self.plugins_instances_ids.remove(instance_id)

    def _execute_callback_on_instance(self, instance_id: str, callback: execute_callback, args: Optional[dict[str, Any]] = None) -> Any:
        if instance_id not in self.plugins_instances:
            raise ValueError(
                f"Plugin instance with id '{instance_id}' does not exist.")

        plugin_instance = self.plugins_instances[instance_id]
        return callback(plugin_instance, args, self.processes_queue, self.process_metadata)

    def execute_callback_on_all_instances(self, callback: execute_callback, args: Optional[dict[str, Any]] = None, need_response: bool = True) -> list[Any]:
        results = []
        for instance_id in self.plugins_instances_ids:
            result = self.execute_callback_on_instance(
                instance_id, callback, args, need_response)
            results.append(result)
        return results

    def execute_callback_on_instance(self, instance_id: str, callback: execute_callback, args: Optional[dict[str, Any]] = None, need_response: bool = True) -> Any:
        self._parent_conn.send(
            ("execute_callback_on_instance", instance_id, callback, args, need_response))
        if not need_response:
            return True
        res = self._parent_conn.recv()
        if not res.get("is_ok", False):
            exception = res.get("exception", UnknownError())
            raise exception
        return res.get("result", None)

    def get_properties(self, settings: Optional[Settings]) -> list[dict[str, Any]]:
        self._parent_conn.send(("get_properties", settings))
        res = self._parent_conn.recv()
        return res

    def set_timeout(self, timeout: float | int | None) -> None:
        self.timeout = timeout
        self._parent_conn.send(("set_timeout", timeout))

    def __get_entry_point(self, group: str):
        if group not in self.process_metadata.entry_points:
            return None

        entry_point = self.process_metadata.entry_points[group]
        module_path, symbol_name = entry_point.split(":")
        module_path = module_path.replace(".", os.sep)
        module_path = module_path + ".py"
        return module_path, symbol_name

    def __load_dependencies(self) -> None:
        dependencies_path = os.path.join(
            self.plugin_dir_path, self.plugin_dependencies_path)
        if os.path.exists(dependencies_path):
            sys.path.append(dependencies_path)

    def __load_symbol(self, group: str) -> Any | None:
        entry_point = self.__get_entry_point(group)
        if entry_point is None:
            return None
        module_path, symbol_name = entry_point
        full_module_path = os.path.join(
            self.plugin_dir_path, module_path)
        full_module_path = os.path.normpath(full_module_path)
        if not os.path.exists(full_module_path):
            raise FileNotFoundError(f"Module file not found at {module_path}")

        spec = importlib.util.spec_from_file_location(
            self.process_metadata.dir_name, full_module_path)
        if spec is None or spec.loader is None:
            return None
        self.__load_dependencies()
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        return getattr(module, symbol_name)

    def __load_plugin(self) -> type[Plugin]:
        entry_point = self.__get_entry_point(
            self.METADATA_ENTRY_POINTS["plugin"])
        if entry_point is None:
            raise ImportError(
                f"Plugin '{self.process_metadata.dir_name}' does not have an entry point defined")
        module_path, symbol_name = entry_point

        symbol = self.__load_symbol(self.METADATA_ENTRY_POINTS["plugin"])
        if (
            symbol is None
            or not isinstance(symbol, type)
            or not issubclass(symbol, Plugin)
            or symbol is Plugin
        ):
            raise ImportError(
                f"Cannot load plugin at {self.process_metadata.dir_name}: {module_path} for class {symbol_name}"
            )

        return symbol

    def __load_properties(self) -> Properties | None:
        entry_point = self.__get_entry_point(
            self.METADATA_ENTRY_POINTS["properties"])
        if entry_point is None:
            return None

        module_path, symbol_name = entry_point
        symbol = self.__load_symbol(self.METADATA_ENTRY_POINTS["properties"])
        if symbol is None:
            raise ImportError(
                f"Cannot load properties at {self.process_metadata.dir_name}: {module_path} for class {symbol_name}"
            )

        if callable(symbol):
            instance = symbol()
        else:
            instance = symbol

        if not isinstance(instance, Properties):
            raise ImportError(
                f"Cannot load plugin properties at {self.process_metadata.dir_name}: {module_path} for class {symbol_name}"
            )

        return instance
