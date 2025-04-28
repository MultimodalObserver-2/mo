import json
from unittest.mock import MagicMock, mock_open, patch

import pytest

from api.core.file_management.exceptions import (InvalidFileNameError,
                                                 NotFoundError)
from api.core.file_management.json_storage import JsonStorage


@pytest.fixture
def json_storage():
    with (
        patch(
            "api.core.file_management.json_storage.JsonStorage.create_storage",
            return_value="test.json",
        ),
        patch("api.core.file_management.json_storage.FileLock"),
    ):
        return JsonStorage(file_name="test.json")


def test_create_storage_success():
    with (
        patch(
            "api.core.file_management.json_storage.FileValidators.is_valid_file_name",
            return_value=True,
        ),
        patch("api.core.file_management.json_storage.os.path.isfile", return_value=False),
        patch("api.core.file_management.json_storage.open", mock_open()) as m,
    ):

        path = JsonStorage.create_storage("file.json")
        assert path.endswith("file.json")
        m.assert_called_once()


def test_create_storage_invalid_name():
    with patch(
        "api.core.file_management.json_storage.FileValidators.is_valid_file_name",
        return_value=False,
    ):
        with pytest.raises(InvalidFileNameError):
            JsonStorage.create_storage("invalid/file")


def test_insert_one(json_storage):
    data_before = []
    data_after = [{"id": 1, "name": "Test"}]

    mock = mock_open(read_data=json.dumps(data_before))

    with patch("api.core.file_management.json_storage.open", mock):
        with (
            patch("api.core.file_management.json_storage.json.load", return_value=data_before),
            patch("api.core.file_management.json_storage.json.dump") as mock_dump,
        ):

            json_storage.insert_one({"id": 1, "name": "Test"})
            mock_dump.assert_called_once()


def test_find_all(json_storage):
    expected = [{"id": 1}]
    with (
        patch(
            "api.core.file_management.json_storage.open", mock_open(read_data=json.dumps(expected))
        ),
        patch("api.core.file_management.json_storage.json.load", return_value=expected),
    ):

        result = json_storage.find_all()
        assert result == expected


def test_find_one_found(json_storage):
    data = [{"id": 1}, {"id": 2}]
    with patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=data):
        found = json_storage.find_one({"id": 2})
        assert found == {"id": 2}


def test_find_one_not_found(json_storage):
    data = [{"id": 1}]
    with patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=data):
        found = json_storage.find_one({"id": 99})
        assert found is None


def test_exists_found(json_storage):
    data = [{"id": 1}]
    with patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=data):
        assert json_storage.exists({"id": 1}) is True


def test_exists_not_found(json_storage):
    data = [{"id": 1}]
    with patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=data):
        assert json_storage.exists({"id": 2}) is False


def test_update_success(json_storage):
    initial_data = [{"id": 1, "name": "Old"}]
    updated_doc = {"id": 1, "name": "New"}

    with (
        patch(
            "api.core.file_management.json_storage.JsonStorage.find_all", return_value=initial_data
        ),
        patch("api.core.file_management.json_storage.JsonStorage._find_index", return_value=0),
        patch("api.core.file_management.json_storage.open", mock_open()) as m,
        patch("api.core.file_management.json_storage.json.dump") as mock_dump,
    ):

        json_storage.update({"id": 1}, updated_doc)
        mock_dump.assert_called_once()


def test_update_not_found(json_storage):
    with (
        patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=[]),
        patch("api.core.file_management.json_storage.JsonStorage._find_index", return_value=None),
    ):
        with pytest.raises(NotFoundError):
            json_storage.update({"id": 1}, {"id": 1, "name": "New"})


def test_delete_one_success(json_storage):
    initial_data = [{"id": 1, "name": "Old"}]

    with (
        patch(
            "api.core.file_management.json_storage.JsonStorage.find_all", return_value=initial_data
        ),
        patch("api.core.file_management.json_storage.JsonStorage._find_index", return_value=0),
        patch("api.core.file_management.json_storage.open", mock_open()) as m,
        patch("api.core.file_management.json_storage.json.dump") as mock_dump,
    ):

        json_storage.delete_one({"id": 1})
        mock_dump.assert_called_once()


def test_delete_one_not_found(json_storage):
    with (
        patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=[]),
        patch("api.core.file_management.json_storage.JsonStorage._find_index", return_value=None),
    ):
        with pytest.raises(NotFoundError):
            json_storage.delete_one({"id": 2})


def test_find_index_found(json_storage):
    data = [{"id": 1}, {"id": 2}]
    with patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=data):
        index = json_storage._find_index({"id": 2})
        assert index == 1


def test_find_index_not_found(json_storage):
    data = [{"id": 1}, {"id": 2}]
    with patch("api.core.file_management.json_storage.JsonStorage.find_all", return_value=data):
        index = json_storage._find_index({"id": 3})
        assert index is None
