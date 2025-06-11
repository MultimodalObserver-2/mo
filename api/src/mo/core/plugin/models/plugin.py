from abc import ABC, abstractmethod
from typing import Optional

from pydantic import BaseModel, PrivateAttr

from mo.core.plugin.models.semantic_version import SemanticVersion
from mo.core.plugin.models.settings import Settings
from mo.core.plugin.models.sys_platform import SysPlatform


class PluginAuthor(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class PluginIcons(BaseModel):
    dark: Optional[str] = None
    light: Optional[str] = None


class PluginPublisher(BaseModel):
    id: str
    name: str
    url: Optional[str] = None


class PluginMetadata(BaseModel):
    plugin_id: str
    name: str
    description: str
    version: SemanticVersion
    publisher: PluginPublisher
    repository: str
    icon_path: Optional[str] | Optional[PluginIcons] = None
    author: Optional[PluginAuthor] = None
    platform: SysPlatform
    _location: Optional[str] = PrivateAttr(default=None)
    _module: Optional[str] = PrivateAttr(default=None)
    _is_loaded: bool = PrivateAttr(default=False)
    _error: Optional[str] = PrivateAttr(default=None)

    def get_final_id(self) -> str:
        return f"{self.publisher.id}.{self.plugin_id}"

    def from_final_id(self, final_id: str) -> None:
        parts = final_id.split(".")
        if len(parts) != 2:
            raise ValueError("Invalid final ID format. Expected 'publisher_id.plugin_id'.")
        self.publisher.id = parts[0]
        self.plugin_id = parts[1]

    def is_plugin(self, plugin_id: str, publisher_id) -> bool:
        return self.plugin_id == plugin_id and self.publisher.id == publisher_id

    def is_plugin_from_final_id(self, final_id: str) -> bool:
        return self.get_final_id() == final_id


class Plugin(ABC):
    metadata: PluginMetadata
    settings: Settings = Settings()
    _module_name: str = "core"

    @abstractmethod
    def load(self):
        pass

    @abstractmethod
    def unload(self):
        pass

    def configure(self, settings: Settings):
        self.settings = settings
        self.on_configure(settings)

    def on_configure(self, settings: Settings) -> None:
        """Override this method to handle configuration changes.
        Args:
            settings (Settings): The updated settings for the plugin.
        """
        pass
