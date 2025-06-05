
import importlib
import importlib.util
from multiprocessing import Pipe, Process, Queue
from multiprocessing.connection import PipeConnection
import os
import sys
import threading
import time
from typing import Any, Callable, Optional

from api.core.config.constants import APP_DATA_DIR, RELATIVE_PLUGINS_DIR_PATH
from api.core.plugin.plugin import Plugin, PluginMetadata
from api.core.plugin.properties import Properties
from api.core.plugin.settings import Settings


class PluginProcessMetadata:
    dir_name: str
    metadata: PluginMetadata
    entry_points: dict[str, str]
    status_queue: Queue
    check_types: list[type]
    initial_settings: Optional[Settings] = None

    def __init__(self, dir_name: str, metadata: PluginMetadata, entry_points: dict[str, str], status_queue: Queue, check_types: list[type]):
        self.dir_name = dir_name
        self.metadata = metadata
        self.entry_points = entry_points
        self.status_queue = status_queue
        self.check_types = check_types

execute_callback = Callable[[Plugin, Optional[dict[str, Any]], Optional[Queue], PluginProcessMetadata], Any]

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

    def __init__(self, process_metadata: PluginProcessMetadata, load_main_instance: bool = False, keep_running: bool = False, timeout: Optional[float | int] = None, processes_queue: Optional[Queue] = None):
        super().__init__()
        dependencies_name = "dependencies"
        plugins_dir = RELATIVE_PLUGINS_DIR_PATH
        self.metadata_entry_points = {
            "plugin": "mo.plugin",
            "properties": "mo.plugin.properties",
        }
        plugins_path = os.path.join(APP_DATA_DIR, plugins_dir)
        plugins_path = os.path.normpath(plugins_path)
        self.plugin_dir_path = os.path.join(plugins_path, process_metadata.dir_name)
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
            for plugin_type in self.process_metadata.check_types:
                if not issubclass(self.plugin_class, plugin_type):
                    self.process_metadata.check_types.remove(plugin_type)
            load_status["is_loaded"] = True
            load_status["plugin_types"] = self.process_metadata.check_types
            load_status["module_name"] = self.plugin_class._module_name
            self.process_metadata.status_queue.put(load_status)
        except Exception as e:
            load_status = {
                "is_loaded": False,
                "error": str(e)
            }
            self.process_metadata.status_queue.put(load_status)
            return
        
        start_time = None
        if self.timeout is not None:
            start_time = time.time()
        while self.keep_running:
            if start_time is not None and self.timeout is not None and (time.time() - start_time > self.timeout):
                break
            if self._child_conn.poll(0.01):
                command, *args = self._child_conn.recv()
                if command == "get_properties":
                    settings = args[0] if args else None
                    properties = self.properties.get_properties_dict(settings)
                    self._child_conn.send(properties)
                elif command == "validate_properties":
                    settings = args[0] if args else None
                    response = {}
                    try:
                        self.properties.validate(settings or Settings())
                        response["is_valid"] = True
                        self._child_conn.send(response)
                    except Exception as e:
                        response["is_valid"] = False
                        response["error"] = str(e)
                        self._child_conn.send(response)
                elif command == "add_plugin_instance":
                    instance_id = args[0]
                    settings = args[1] if len(args) > 1 else None
                    try:
                        self._add_plugin_instance(instance_id, settings)
                        self._child_conn.send({"is_ok": True})
                    except Exception as e:
                        self._child_conn.send({"is_ok": False, "error": str(e)})
                elif command == "execute_callback_on_instance":
                    instance_id = args[0]
                    callback = args[1]
                    extra_args = args[2] if len(args) > 2 else None
                    need_response = args[3] if len(args) > 3 else True
                    try:
                        result = self._execute_callback_on_instance(
                            instance_id, callback, extra_args)
                        if need_response:
                            self._child_conn.send({"is_ok": True, "result": result})
                    except Exception as e:
                        if need_response:
                            self._child_conn.send({"is_ok": False, "error": str(e)})
                elif command == "set_timeout":
                    self.timeout = args[0]
                elif command == "stop":
                    self.keep_running = False
                    if self.load_main_instance:
                        instance.unload()
                    self._child_conn.send({"is_ok": True})
                    break
                start_time = time.time() if self.timeout is not None else None
        if self.load_main_instance:
            instance.unload()
        self._child_conn.close()

    def stop(self, timeout: Optional[float] = None, force: bool = False) -> None:
        if not self.is_alive():
            return
        self._parent_conn.send(("stop",))
        res = self._parent_conn.recv()
        if not res.get("is_ok", False):
            error = res.get("error", "Unknown error")
            raise Exception(error)
        self._parent_conn.close()
        self.join(timeout)
        if force and self.is_alive():
            self.terminate()
            self.join()

    def validate_properties(self, settings: Optional[Settings]) -> None:
        if not self.is_alive():
            return
        self._parent_conn.send(("validate_properties", settings))
        res = self._parent_conn.recv()
        if not res.get("is_valid", False):
            error = res.get("error", "Unknown error")
            raise Exception(error)
        
    def _add_plugin_instance(self, instance_id: str, settings: Optional[Settings] = None) -> None:
        if not self.is_alive():
            return
        if instance_id in self.plugins_instances:
            raise ValueError(f"Plugin instance with id '{instance_id}' already exists.")
        if self.plugin_class is None:
            raise RuntimeError("Plugin class is not loaded.")
        plugin_instance = self.plugin_class()
        plugin_instance.load()
        plugin_instance.configure(settings or Settings())
        self.plugins_instances[instance_id] = plugin_instance
        self.plugins_instances_ids.append(instance_id)

    def add_plugin_instance(self, instance_id: str, settings: Optional[Settings] = None) -> None:
        if not self.is_alive():
            return
        
        self._parent_conn.send(("add_plugin_instance", instance_id, settings))
        res = self._parent_conn.recv()
        if not res.get("is_ok", False):
            error = res.get("error", "Unknown error")
            raise Exception(error)
        self.plugins_instances_ids.append(instance_id)

    def _execute_callback_on_instance(self, instance_id: str, callback: execute_callback, args: Optional[dict[str, Any]] = None) -> Any:
        if not self.is_alive():
            return None
        if instance_id not in self.plugins_instances:
            raise ValueError(f"Plugin instance with id '{instance_id}' does not exist.")
        
        plugin_instance = self.plugins_instances[instance_id]
        return callback(plugin_instance, args, self.processes_queue, self.process_metadata)
    
    def execute_callback_on_all_instances(self, callback: execute_callback, args: Optional[dict[str, Any]] = None, need_response: bool = True) -> list[Any]:
        if not self.is_alive():
            return []
        results = []
        for instance_id in self.plugins_instances_ids:
            result = self.execute_callback_on_instance(instance_id, callback, args, need_response)
            results.append(result)
        return results

    def execute_callback_on_instance(self, instance_id: str, callback: execute_callback, args: Optional[dict[str, Any]] = None, need_response: bool = True) -> Any:
        if not self.is_alive():
            return None
        self._parent_conn.send(
            ("execute_callback_on_instance", instance_id, callback, args, need_response))
        if not need_response:
            return True
        res = self._parent_conn.recv()
        if not res.get("is_ok", False):
            error = res.get("error", "Unknown error")
            raise Exception(error)
        return res.get("result", None)

    def get_properties(self, settings: Optional[Settings]) -> list[dict[str, Any]]:
        if not self.is_alive():
            return []
        self._parent_conn.send(("get_properties", settings))
        res = self._parent_conn.recv()
        return res
    
    def set_timeout(self, timeout: float | int | None) -> None:
        if not self.is_alive():
            return
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
            self.metadata_entry_points["plugin"])
        if entry_point is None:
            raise ImportError(
                f"Plugin '{self.process_metadata.dir_name}' does not have an entry point defined")
        module_path, symbol_name = entry_point

        symbol = self.__load_symbol(self.metadata_entry_points["plugin"])
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
        entry_point = self.__get_entry_point(self.metadata_entry_points["properties"])
        if entry_point is None:
            return None

        module_path, symbol_name = entry_point
        symbol = self.__load_symbol(self.metadata_entry_points["properties"])
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
