import re


class FileValidators:
    """Class containing validation methods for file and directory."""

    @staticmethod
    def is_valid_directory_name(name: str) -> bool:
        """Validates if a directory name is valid according to restricted characters.

        Args:
            name (str): Directory name to validate.

        Returns:
            bool: True if the directory name is valid, False otherwise.
        """
        pattern = r'^[^<>:"/\\|?*\x00-\x1F]+(?<! )$'
        return bool(re.match(pattern, name))

    @staticmethod
    def is_valid_file_name(name: str) -> bool:
        """Validates if a file name is valid according to restricted characters and proper extension.

        Args:
            name (str): File name to validate.

        Returns:
            bool: True if the file name is valid, False otherwise.
        """
        pattern = r'^[^<>:"/\\|?*\x00-\x1F]+(?<! )\.[^<>:"/\\|?*\x00-\x1F]+$'
        return bool(re.match(pattern, name))
