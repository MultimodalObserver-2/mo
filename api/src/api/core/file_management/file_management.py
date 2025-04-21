import os
from typing import Optional

from api.core.file_management.exceptions import (InvalidDirectoryNameError,
                                                 InvalidFileNameError)
from api.core.file_management.validators import FileValidators


class FileManagement:
    def __init__(
        self, rel_path: str = "", base_path: Optional[str] = None, make_dirs: bool = False
    ):
        base_path = base_path or os.getcwd()
        self._path = os.path.join(base_path, rel_path)
        self._path = os.path.normpath(self._path)

        if make_dirs:
            os.makedirs(self._path, exist_ok=True)

    def create_directory(self, dir_name: str, rel_path: str = ""):
        if not FileValidators.is_valid_directory_name(dir_name):
            raise InvalidDirectoryNameError(dir_name)
        dir_path = os.path.join(self._path, rel_path, dir_name)
        dir_path = os.path.normpath(dir_path)
        if os.path.exists(dir_path):
            raise FileExistsError(f"Directory {dir_path} already exists.")
        os.mkdir(dir_path)
        return dir_path

    def create_file(self, file_name: str, rel_path: str = "", content: str = ""):
        if not FileValidators.is_valid_file_name(file_name):
            raise InvalidFileNameError(file_name)
        file_path = os.path.join(self._path, rel_path, file_name)
        file_path = os.path.normpath(file_path)
        with open(file_path, "w") as f:
            f.write(content)
        return file_path

    def exists(self, rel_path: str) -> bool:
        return os.path.exists(os.path.join(self._path, rel_path))

    def rename_directory(self, old_name: str, new_name: str, rel_path: str = ""):
        if not FileValidators.is_valid_directory_name(new_name):
            raise InvalidDirectoryNameError(new_name)
        old_path = os.path.join(self._path, rel_path, old_name)
        old_path = os.path.normpath(old_path)
        new_path = os.path.join(self._path, rel_path, new_name)
        new_path = os.path.normpath(new_path)
        os.rename(old_path, new_path)
        return new_path
