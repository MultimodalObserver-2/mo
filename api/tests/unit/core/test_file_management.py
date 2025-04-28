import pytest
from unittest.mock import patch, MagicMock

from api.core.file_management.file_management import FileManagement
from api.core.file_management.exceptions import (InvalidDirectoryNameError,
                                                 InvalidFileNameError,
                                                 NotFoundError)


@pytest.fixture
def file_mgmt():
    return FileManagement(rel_path="test", make_dirs=False)


def test_create_directory_success(file_mgmt):
    with patch("api.core.file_management.file_management.FileValidators.is_valid_directory_name", return_value=True), \
            patch("api.core.file_management.file_management.os.path.exists", return_value=False), \
            patch("api.core.file_management.file_management.os.mkdir") as mock_mkdir:

        path = file_mgmt.create_directory("new_dir")
        mock_mkdir.assert_called_once()
        assert "new_dir" in path


def test_create_directory_invalid_name(file_mgmt):
    with patch("api.core.file_management.file_management.FileValidators.is_valid_directory_name", return_value=False):
        with pytest.raises(InvalidDirectoryNameError):
            file_mgmt.create_directory("invalid/dir")


def test_create_directory_already_exists(file_mgmt):
    with patch("api.core.file_management.file_management.FileValidators.is_valid_directory_name", return_value=True), \
            patch("api.core.file_management.file_management.os.path.exists", return_value=True):

        with pytest.raises(FileExistsError):
            file_mgmt.create_directory("existing_dir")


def test_create_file_success(file_mgmt):
    with patch("api.core.file_management.file_management.FileValidators.is_valid_file_name", return_value=True), \
            patch("api.core.file_management.file_management.open", create=True) as mock_open:

        mock_open.return_value.__enter__.return_value.write = MagicMock()
        path = file_mgmt.create_file("file.txt", content="Hello")
        mock_open.assert_called_once()
        assert "file.txt" in path


def test_create_file_invalid_name(file_mgmt):
    with patch("api.core.file_management.file_management.FileValidators.is_valid_file_name", return_value=False):
        with pytest.raises(InvalidFileNameError):
            file_mgmt.create_file("bad/name.txt")


def test_exists(file_mgmt):
    with patch("api.core.file_management.file_management.os.path.exists", return_value=True):
        assert file_mgmt.exists("some_path") is True

    with patch("api.core.file_management.file_management.os.path.exists", return_value=False):
        assert file_mgmt.exists("some_path") is False


def test_rename_directory_success(file_mgmt):
    with patch("api.core.file_management.file_management.FileValidators.is_valid_directory_name", return_value=True), \
            patch("api.core.file_management.file_management.os.rename") as mock_rename:

        new_path = file_mgmt.rename_directory("old_dir", "new_dir")
        mock_rename.assert_called_once()
        assert "new_dir" in new_path


def test_rename_directory_invalid_name(file_mgmt):
    with patch("api.core.file_management.file_management.FileValidators.is_valid_directory_name", return_value=False):
        with pytest.raises(InvalidDirectoryNameError):
            file_mgmt.rename_directory("old_dir", "invalid/new_dir")


def test_delete_directory_success(file_mgmt):
    with patch("api.core.file_management.file_management.os.path.exists", return_value=True), \
            patch("api.core.file_management.file_management.shutil.rmtree") as mock_rmtree:

        deleted_path = file_mgmt.delete_directory("dir_to_delete")
        mock_rmtree.assert_called_once()
        assert "dir_to_delete" in deleted_path


def test_delete_directory_not_found(file_mgmt):
    with patch("api.core.file_management.file_management.os.path.exists", return_value=False):
        with pytest.raises(NotFoundError):
            file_mgmt.delete_directory("nonexistent_dir")
