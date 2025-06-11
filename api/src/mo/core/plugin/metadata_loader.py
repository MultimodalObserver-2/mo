import json
import os
from typing import Type, TypeVar

from pydantic import ValidationError

from mo.core.plugin.models.plugin import (
    Plugin,
    PluginAuthor,
    PluginIcons,
    PluginMetadata,
    PluginPublisher,
)
from mo.core.plugin.models.semantic_version import SemanticVersion
from mo.core.plugin.models.sys_platform import SysPlatform


def load_plugin_metadata(path: str) -> PluginMetadata:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Metadata file not found at {path}")

    with open(path, "r") as f:
        data = json.load(f)
        metadata_dict = {
            "plugin_id": data.get("id"),
            "name": data.get("name"),
            "description": data.get("description"),
            "version": SemanticVersion.from_string(data.get("version")),
            "publisher": PluginPublisher(**data.get("publisher")),
            "repository": data.get("repository"),
            "author": PluginAuthor(**data.get("author")) if data.get("author") else None,
            "platform": SysPlatform(**data.get("platform")),
        }
        icon = data.get("icon")
        if icon and isinstance(icon, dict):
            metadata_dict["icon_path"] = PluginIcons(**icon)
        else:
            metadata_dict["icon_path"] = icon
        try:
            return PluginMetadata(**metadata_dict)
        except ValidationError as e:
            raise ValueError(f"Invalid metadata format: {e}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")


T = TypeVar("T", bound=Plugin)


def load_metadata_json(rel_path: str = ""):
    """
    Load the metadata.json file navigating from the current class directory to the relative path
    """

    def decorator(cls: Type[T]) -> Type[T]:
        if not issubclass(cls, Plugin):
            raise TypeError(f"{cls.__name__} must be a subclass of Plugin")
        import inspect
        import os

        stack = inspect.stack()
        for frame in stack:
            if frame.function == "<module>":
                base_file = frame.filename
                break
        else:
            raise RuntimeError("Could not find the base file in the stack.")

        base_file_dir = os.path.dirname(os.path.abspath(base_file))
        base_plugin_dir = os.path.join(base_file_dir, rel_path)
        base_plugin_dir = os.path.abspath(base_plugin_dir)
        metadata_path = os.path.join(base_plugin_dir, "metadata.json")

        cls.metadata = load_plugin_metadata(metadata_path)
        cls.metadata._module = cls._module_name
        cls.metadata._is_loaded = True
        cls.metadata._location = base_plugin_dir
        return cls

    return decorator
