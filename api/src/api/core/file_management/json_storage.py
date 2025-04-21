import json
import os
from typing import Any, Optional

from filelock import FileLock

from api.core.file_management.exceptions import (InvalidFileNameError,
                                                 NotFoundError)
from api.core.file_management.validators import FileValidators


class JsonStorage:
    def __init__(self, file_name: str, rel_path: str = "", base_path: Optional[str] = None):
        self._path = self.create_storage(file_name, rel_path, base_path)
        self.lock = FileLock(f"{self._path}.lock")

    @staticmethod
    def create_storage(file_name: str, rel_path: str = "", base_path: Optional[str] = None):
        if (not file_name.endswith(".json")) or (not FileValidators.is_valid_file_name(file_name)):
            raise InvalidFileNameError(file_name=file_name)
        base_path = base_path or os.getcwd()
        path = os.path.join(base_path, rel_path, file_name)
        if not os.path.isfile(path):
            with open(path, "w") as file:
                json.dump([], file)
        return path

    def insert_one(self, document: dict[str, Any]):
        with self.lock:
            with open(self._path, "r+") as file:
                content = json.load(file)
                content.append(document)
                file.seek(0)
                json.dump(content, file, indent=4, default=str)

    def find_all(self) -> list[dict[str, Any]]:
        with self.lock:
            with open(self._path, "r") as file:
                return json.load(file)

    def find_one(self, query: dict[str, Any]) -> Optional[dict[str, Any]]:
        content = self.find_all()
        for document in content:
            if self._is_subset(document, query):
                return document
        return None

    def exists(self, query: dict[str, Any]) -> bool:
        content = self.find_all()
        for document in content:
            if self._is_subset(document, query):
                return True
        return False

    def update(self, query: dict[str, Any], new_document: dict[str, Any]):
        documents = self.find_all()
        document_idx = self._find_index(query)
        if document_idx is None:
            raise NotFoundError("Document not found")
        
        documents[document_idx] = new_document
        with self.lock:
            with open(self._path, "w") as file:
                json.dump(documents, file, indent=4, default=str)

    def _find_index(self, query: dict[str, Any]) -> Optional[int]:
        content = self.find_all()
        for index, document in enumerate(content):
            if self._is_subset(document, query):
                return index
        return None

    def _is_subset(self, document: dict[str, Any], query: dict[str, Any]) -> bool:
        return all(item in document.items() for item in query.items())
