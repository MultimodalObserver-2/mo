import asyncio
import logging
import os
import time

from watchdog.events import (
    DirCreatedEvent,
    DirDeletedEvent,
    DirMovedEvent,
    FileCreatedEvent,
    FileDeletedEvent,
    FileMovedEvent,
    FileSystemEventHandler,
)

from mo.core.config import constants
from mo.core.plugin.manager import PluginManager
from mo.core.utils.singleton import singleton


@singleton
class PluginsDirHandler(FileSystemEventHandler):
    """Handles file system events in the plugins directory."""

    def __init__(self) -> None:
        """Initializes the PluginsDirHandler."""
        super().__init__()
        self.plugin_manager = PluginManager()
        self.known_dirs = self.plugin_manager.load_all_plugins()
        self.plugins_path = self.plugin_manager.plugins_path
        self.suspended = False
        self.logger = logging.getLogger(constants.LOGGER_NAME)

    def suspend(self):
        """Suspends the handler, preventing it from processing events."""
        self.suspended = True

    def resume(self):
        """Resumes the handler, allowing it to process events again."""
        self.suspended = False

    def add_known_dir(self, dir_name: str) -> None:
        """Adds a directory to the list of known directories.
        Args:
            dir_name (str): The name of the directory to add.
        """
        if dir_name in self.known_dirs:
            return
        self.known_dirs.append(dir_name)

    def remove_known_dir(self, dir_name: str) -> None:
        """Removes a directory from the list of known directories.
        Args:
            dir_name (str): The name of the directory to remove.
        """
        if dir_name not in self.known_dirs:
            return
        self.known_dirs.remove(dir_name)

    def wait_for_file(self, path, timeout=20.0, interval=0.01) -> bool:
        """Waits for a file to be created at the specified path.
        Args:
            path (str): The path to the file to wait for.
            timeout (float): The maximum time to wait in seconds.
            interval (float): The time to wait between checks in seconds.
        Returns:
            bool: True if the file is found within the timeout, False otherwise.
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            if os.path.exists(path):
                return True
            time.sleep(interval)
        return False

    def on_created(self, event: DirCreatedEvent | FileCreatedEvent) -> None:
        """Handles the creation of a directory in the plugins directory.
        Args:
            event (DirCreatedEvent | FileCreatedEvent): The event representing the creation.
        """
        if not event.is_directory or self.suspended:
            # Ignore file creation events or if the handler is suspended
            return
        src_path = event.src_path
        src_path = str(src_path)
        dir_name = os.path.relpath(src_path, self.plugins_path)

        metadata_path = self.plugin_manager._get_plugin_metadata_path(dir_name)
        if not self.wait_for_file(metadata_path):
            # Implemented for race condition when a directory is created
            # but the metadata file is not yet completely written
            self.logger.error(
                f"[PluginsDirHandler] Metadata file not found for plugin {dir_name}", exc_info=True)
            return
        try:
            self.plugin_manager.register_plugin(dir_name)
            self.known_dirs.append(dir_name)
        except Exception as e:
            self.logger.error(
                f"[PluginsDirHandler] Failed to load plugin {dir_name}: {e}", exc_info=True)

    def on_deleted(self, event: DirDeletedEvent | FileDeletedEvent) -> None:
        """Handles the deletion of a directory in the plugins directory.
        Args:
            event (DirDeletedEvent | FileDeletedEvent): The event representing the deletion.
        """
        if self.suspended:
            return

        src_path = event.src_path
        src_path = str(src_path)
        dir_name = os.path.relpath(src_path, self.plugins_path)
        if dir_name not in self.known_dirs:
            return

        try:
            self.plugin_manager.remove_plugin_by_dir(dir_name)
            self.known_dirs.remove(dir_name)
        except Exception as e:
            self.logger.error(
                f"[PluginsDirHandler] Failed to remove plugin {dir_name}: {e}", exc_info=True)

    def on_moved(self, event: DirMovedEvent | FileMovedEvent) -> None:
        """Handles the renaming of a directory in the plugins directory.
        Args:
            event (DirMovedEvent | FileMovedEvent): The event representing the move.
        """
        if not event.is_directory or self.suspended:
            return

        src_path = event.src_path
        src_path = str(src_path)
        old_dir_name = os.path.relpath(src_path, self.plugins_path)
        dest_path = event.dest_path
        dest_path = str(dest_path)
        new_dir_name = os.path.relpath(dest_path, self.plugins_path)
        try:
            self.plugin_manager.rename_plugin_dir(new_dir_name)
            self.known_dirs.remove(old_dir_name)
            self.known_dirs.append(new_dir_name)
        except Exception as e:
            self.logger.error(
                f"[PluginsDirHandler] Failed to rename plugin {old_dir_name} to {new_dir_name}: {e}", exc_info=True)


def start_plugins_dir_observer():
    """Starts the observer for the plugins directory."""
    from watchdog.observers import Observer
    plugins_dir_handler = PluginsDirHandler()
    observer = Observer()
    observer.schedule(
        plugins_dir_handler,
        path=plugins_dir_handler.plugin_manager.plugins_path,
        recursive=False,
    )
    observer.start()

async def start_plugins_dir_observer_async():
    """Asynchronously starts the observer for the plugins directory."""
    await asyncio.to_thread(start_plugins_dir_observer)
