import os
import platform
import shutil
from typing import Optional

import psutil

from api.core.config.constants import APP_DATA_DIR
from api.core.file_management.exceptions import (InvalidDirectoryNameError,
                                                 InvalidFileNameError,
                                                 NotFoundError)
from api.core.file_management.validators import FileValidators


class FileManagement:
    """Class for managing file system operations such as creating,
    renaming, and deleting files and directories.
    """

    def __init__(
        self, rel_path: str = "", base_path: Optional[str] = None, make_dirs: bool = False
    ):
        """Initializes a FileManagement instance.
        Args:
            rel_path (str, optional): Relative path from the base path. Defaults to "".
            base_path (Optional[str], optional): Base path for operations. Defaults to current working directory.
            make_dirs (bool, optional): Whether to create directories if they don't exist. Defaults to False.
        """
        base_path = base_path or APP_DATA_DIR
        self._path = os.path.join(base_path, rel_path)
        self._path = os.path.normpath(self._path)

        if make_dirs:
            os.makedirs(self._path, exist_ok=True)

    def create_directory(self, dir_name: str, rel_path: str = "") -> str:
        """Creates a new directory.
        Args:
            dir_name (str): Name of the directory to create.
            rel_path (str, optional): Subdirectory path where the new directory will be created. Defaults to "".
        Returns:
            str: Path of the created directory.
        Raises:
            InvalidDirectoryNameError: If the directory name is invalid.
            FileExistsError: If the directory already exists.
        """
        if not FileValidators.is_valid_directory_name(dir_name):
            raise InvalidDirectoryNameError(dir_name)
        dir_path = os.path.join(self._path, rel_path, dir_name)
        dir_path = os.path.normpath(dir_path)
        if os.path.exists(dir_path):
            raise FileExistsError(f"Directory {dir_path} already exists.")
        os.mkdir(dir_path)
        return dir_path

    def create_file(self, file_name: str, rel_path: str = "", content: str = "") -> str:
        """Creates a new file with optional content.
        Args:
            file_name (str): Name of the file to create.
            rel_path (str, optional): Subdirectory path where the file will be created. Defaults to "".
            content (str, optional): Content to write into the file. Defaults to empty string.
        Returns:
            str: Path of the created file.
        Raises:
            InvalidFileNameError: If the file name is invalid.
        """
        if not FileValidators.is_valid_file_name(file_name):
            raise InvalidFileNameError(file_name)
        file_path = os.path.join(self._path, rel_path, file_name)
        file_path = os.path.normpath(file_path)
        with open(file_path, "w") as f:
            f.write(content)
        return file_path

    def exists(self, rel_path: str) -> bool:
        """Checks if a file or directory exists at a relative path.
        Args:
            rel_path (str): Relative path to check.
        Returns:
            bool: True if path exists, False otherwise.
        """
        path = os.path.join(self._path, rel_path)
        path = os.path.normpath(path)
        return os.path.exists(path)

    @staticmethod
    def is_file(path: str) -> bool:
        """Checks if a given path is a file.
        Args:
            path (str): Path to check.
        Returns:
            bool: True if path is a file, False otherwise.
        """
        norm_path = os.path.normpath(path)
        return os.path.isfile(norm_path)

    def rename_directory(self, old_name: str, new_name: str, rel_path: str = "") -> str:
        """Renames an existing directory.
        Args:
            old_name (str): Current name of the directory.
            new_name (str): New name for the directory.
            rel_path (str, optional): Subdirectory path where the directory is located. Defaults to "".
        Returns:
            str: New path of the renamed directory.
        Raises:
            InvalidDirectoryNameError: If the new directory name is invalid.
        """
        if not FileValidators.is_valid_directory_name(new_name):
            raise InvalidDirectoryNameError(new_name)
        old_path = os.path.join(self._path, rel_path, old_name)
        old_path = os.path.normpath(old_path)
        new_path = os.path.join(self._path, rel_path, new_name)
        new_path = os.path.normpath(new_path)
        os.rename(old_path, new_path)
        return new_path

    def delete_directory(self, dir_name: str, rel_path: str = "") -> str:
        """Deletes a directory and its contents.
        Args:
            dir_name (str): Name of the directory to delete.
            rel_path (str, optional): Subdirectory path where the directory is located. Defaults to "".
        Returns:
            str: Path of the deleted directory.
        Raises:
            NotFoundError: If the directory does not exist.
        """
        dir_path = os.path.join(self._path, rel_path, dir_name)
        dir_path = os.path.normpath(dir_path)
        if not os.path.exists(dir_path):
            raise NotFoundError(f"Directory {dir_path} does not exist.")
        shutil.rmtree(dir_path)
        return dir_path

    @staticmethod
    def open_file(file_path: str):
        """Opens a file with the default application.
        Args:
            file_path (str): Path to the file to open.
        """
        operating_system = platform.system()
        if operating_system == "Windows":
            os.startfile(file_path)
        elif operating_system == "Darwin":  # macOS
            os.system(f"open {file_path}")
        else:  # Linux and other Unix-like systems
            os.system(f"xdg-open {file_path}")

    @staticmethod
    def close_process(process_name: str):
        """Closes a process by its name.
        Args:
            process_name (str): Name of the process to close.
        """
        for proc in psutil.process_iter(["pid", "name"]):
            if proc.info["name"] == process_name:
                try:
                    proc.kill()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
