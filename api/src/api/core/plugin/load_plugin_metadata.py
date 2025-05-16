import json
import os
from typing import Type
from api.core.plugin.plugin import Plugin, PluginMetadata
from api.core.plugin.semantic_version import SemanticVersion
from api.core.plugin.sys_platform import SysPlatform
from pydantic import ValidationError


def load_plugin_metadata(path: str) -> PluginMetadata:
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Metadata file not found at {path}")

    with open(path, "r") as f:
        data = json.load(f)
        metadata_dict = {
            "name": data.get("name"),
            "description": data.get("description"),
            "repository": data.get("repository"),
            "icon_path": data.get("icon_path"),
            "author": data.get("author"),
            "author_email": data.get("author_email"),
        }
        platform = data.get("platform")
        version = data.get("version")
        metadata_dict["platform"] = SysPlatform(**platform)
        metadata_dict["version"] = SemanticVersion.from_string(version)
        try:
            return PluginMetadata(**metadata_dict)
        except ValidationError as e:
            raise ValueError(f"Invalid metadata format: {e}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")


def load_metadata_json(rel_path: str = ""):
    """
    Load the metadata.json file navigating from the current class directory to the relative path
    """
    def decorator(cls: Type[Plugin]):
        if not issubclass(cls, Plugin):
            raise TypeError(f"{cls.__name__} must be a subclass of Plugin")
        import inspect
        import os
        stack = inspect.stack()
        for frame in stack:
            if frame.function == '<module>':
                base_file = frame.filename
                break
        else:
            raise RuntimeError("Could not find the base file in the stack.")

        base_file_dir = os.path.dirname(os.path.abspath(base_file))
        base_plugin_dir = os.path.join(base_file_dir, rel_path)
        base_plugin_dir = os.path.abspath(base_plugin_dir)
        metadata_path = os.path.join(base_plugin_dir, "metadata.json")

        cls.metadata = load_plugin_metadata(metadata_path)
        cls.metadata._module = cls._module
        cls.metadata._is_loaded = True
        cls.metadata._location = base_plugin_dir
        return cls
    return decorator
