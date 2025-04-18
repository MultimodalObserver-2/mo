import re


class FileValidators:
    @staticmethod
    def is_valid_directory_name(name: str) -> bool:
        pattern = r'^[^<>:"/\\|?*\x00-\x1F]+(?<! )$'
        return bool(re.match(pattern, name))

    @staticmethod
    def is_valid_file_name(name: str) -> bool:
        pattern = r'^[^<>:"/\\|?*\x00-\x1F]+(?<! )\.[^<>:"/\\|?*\x00-\x1F]+$'
        return bool(re.match(pattern, name))
