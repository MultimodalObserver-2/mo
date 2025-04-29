import json
import os
from typing import Any, Optional

from filelock import FileLock

from api.core.file_management.exceptions import (InvalidFileNameError,
                                                 NotFoundError)
from api.core.file_management.validators import FileValidators


class JsonStorage:
    """Class for managing simple JSON-based storage with file locking for concurrency control."""

    def __init__(self, file_name: str, rel_path: str = "", base_path: Optional[str] = None):
        """Initializes a JsonStorage instance.

        Args:
            file_name (str): Name of the JSON file.
            rel_path (str, optional): Relative path where the file will be stored. Defaults to "".
            base_path (Optional[str], optional): Base path for storage. Defaults to current working directory.
        """
        self._path = self.create_storage(file_name, rel_path, base_path)
        self.lock = FileLock(f"{self._path}.lock")

    @staticmethod
    def create_storage(file_name: str, rel_path: str = "", base_path: Optional[str] = None) -> str:
        """Creates the storage file if it does not exist.

        Args:
            file_name (str): Name of the JSON file.
            rel_path (str, optional): Relative directory path. Defaults to "".
            base_path (Optional[str], optional): Base path for file. Defaults to current working directory.

        Returns:
            str: Full path to the JSON storage file.

        Raises:
            InvalidFileNameError: If the file name is invalid or does not end with ".json".
        """
        if (not file_name.endswith(".json")) or (not FileValidators.is_valid_file_name(file_name)):
            raise InvalidFileNameError(file_name=file_name)
        base_path = base_path or os.getcwd()
        path = os.path.join(base_path, rel_path, file_name)
        if not os.path.isfile(path):
            with open(path, "w") as file:
                json.dump([], file)
        return path

    def insert_one(self, document: dict[str, Any]):
        """Inserts a new document into the JSON storage.

        Args:
            document (dict[str, Any]): Document to insert.
        """
        with self.lock:
            with open(self._path, "r+") as file:
                content = json.load(file)
                content.append(document)
                file.seek(0)
                json.dump(content, file, indent=4, default=str)

    def find_all(self) -> list[dict[str, Any]]:
        """Retrieves all documents from the storage.

        Returns:
            list[dict[str, Any]]: List of all documents.
        """
        with self.lock:
            with open(self._path, "r") as file:
                return json.load(file)

    def find_one(self, query: dict[str, Any]) -> Optional[dict[str, Any]]:
        """Finds the first document matching the given query.

        Args:
            query (dict[str, Any]): Query to match documents.

        Returns:
            Optional[dict[str, Any]]: The first matching document, or None if no match.
        """
        content = self.find_all()
        for document in content:
            if self._is_subset(document, query):
                return document
        return None

    def exists(self, query: dict[str, Any]) -> bool:
        """Checks if a document matching the query exists.

        Args:
            query (dict[str, Any]): Query to match documents.

        Returns:
            bool: True if a matching document exists, False otherwise.
        """
        content = self.find_all()
        for document in content:
            if self._is_subset(document, query):
                return True
        return False

    def update(self, query: dict[str, Any], new_document: dict[str, Any]):
        """Updates the first document matching the query.

        Args:
            query (dict[str, Any]): Query to find the document to update.
            new_document (dict[str, Any]): New document to replace the old one.

        Raises:
            NotFoundError: If no document matches the query.
        """
        documents = self.find_all()
        document_idx = self._find_index(query)
        if document_idx is None:
            raise NotFoundError("Document not found")

        documents[document_idx] = new_document
        with self.lock:
            with open(self._path, "w") as file:
                json.dump(documents, file, indent=4, default=str)

    def delete_one(self, query: dict[str, Any]):
        """Deletes the first document matching the query.

        Args:
            query (dict[str, Any]): Query to find the document to delete.

        Raises:
            NotFoundError: If no document matches the query.
        """
        documents = self.find_all()
        document_idx = self._find_index(query)
        if document_idx is None:
            raise NotFoundError("Document not found")

        documents.pop(document_idx)
        with self.lock:
            with open(self._path, "w") as file:
                json.dump(documents, file, indent=4, default=str)

    def _find_index(self, query: dict[str, Any]) -> Optional[int]:
        """Finds the index of the first document matching the query.

        Args:
            query (dict[str, Any]): Query to match documents.

        Returns:
            Optional[int]: Index of the matching document, or None if no match.
        """
        content = self.find_all()
        for index, document in enumerate(content):
            if self._is_subset(document, query):
                return index
        return None

    def _is_subset(self, document: dict[str, Any], query: dict[str, Any]) -> bool:
        """Checks if the query is a subset of the document.

        Args:
            document (dict[str, Any]): Document to check.
            query (dict[str, Any]): Query to match.

        Returns:
            bool: True if query is a subset of document, False otherwise.
        """
        return all(item in document.items() for item in query.items())
