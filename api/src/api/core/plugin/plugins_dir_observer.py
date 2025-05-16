import os
import time
from time import sleep

from watchdog.events import (DirCreatedEvent, DirDeletedEvent, DirMovedEvent,
                             FileCreatedEvent, FileDeletedEvent,
                             FileMovedEvent, FileSystemEventHandler)

from api.core.plugin.plugin_management import PluginManagement
from api.core.utils.singleton import singleton


@singleton
class PluginsDirHandler(FileSystemEventHandler):
    def __init__(self) -> None:
        super().__init__()
        self.plugin_management = PluginManagement()
        self.known_dirs = self.plugin_management.load_all_plugins()
        self.plugins_path = self.plugin_management.plugins_path
        self.suspended = False

    def suspend(self):
        self.suspended = True

    def resume(self):
        self.suspended = False

    def add_known_dir(self, dir_name: str) -> None:
        if dir_name in self.known_dirs:
            return
        self.known_dirs.append(dir_name)

    def remove_known_dir(self, dir_name: str) -> None:
        if dir_name not in self.known_dirs:
            return
        self.known_dirs.remove(dir_name)

    def wait_for_file(self, path, timeout=1.0, interval=0.01) -> bool:
        start_time = time.time()
        while time.time() - start_time < timeout:
            if os.path.exists(path):
                return True
            sleep(interval)
        return False

    def on_created(self, event: DirCreatedEvent | FileCreatedEvent) -> None:
        if not event.is_directory or self.suspended:
            return
        src_path = event.src_path
        src_path = str(src_path)
        dir_name = os.path.relpath(src_path, self.plugins_path)

        metadata_path = self.plugin_management._get_plugin_metadata_path(dir_name)
        if not self.wait_for_file(metadata_path):
            # Implemented for race condition when a directory is created
            # but the metadata file is not yet completely written
            print(f"ERROR: Metadata file not found for plugin {dir_name}")
            return
        try:
            self.plugin_management.add_plugin(dir_name)
            self.known_dirs.append(dir_name)
        except Exception as e:
            print(f"ERROR: Failed to load plugin {dir_name}")
            print(f"Traceback: {e}")

    def on_deleted(self, event: DirDeletedEvent | FileDeletedEvent) -> None:
        if self.suspended:
            return

        src_path = event.src_path
        src_path = str(src_path)
        dir_name = os.path.relpath(src_path, self.plugins_path)
        if dir_name not in self.known_dirs:
            return

        try:
            self.plugin_management.remove_plugin_by_dir(dir_name)
            self.known_dirs.remove(dir_name)
        except Exception as e:
            print(f"ERROR: Failed to remove plugin {dir_name}")
            print(f"Traceback: {e}")

    def on_moved(self, event: DirMovedEvent | FileMovedEvent) -> None:
        if not event.is_directory or self.suspended:
            return

        src_path = event.src_path
        src_path = str(src_path)
        old_dir_name = os.path.relpath(src_path, self.plugins_path)
        dest_path = event.dest_path
        dest_path = str(dest_path)
        new_dir_name = os.path.relpath(dest_path, self.plugins_path)
        try:
            self.plugin_management.rename_plugin_dir(new_dir_name)
            self.known_dirs.remove(old_dir_name)
            self.known_dirs.append(new_dir_name)
        except Exception as e:
            print(f"ERROR: Failed to rename plugin {old_dir_name} to {new_dir_name}")
            print(f"Traceback: {e}")


def start_plugins_dir_observer():
    from watchdog.observers import Observer

    plugins_dir_handler = PluginsDirHandler()
    observer = Observer()
    observer.schedule(
        plugins_dir_handler,
        path=plugins_dir_handler.plugin_management.plugins_path,
        recursive=False,
    )
    observer.start()
