from abc import ABC, abstractmethod
from typing import Optional

from pydantic import BaseModel, PrivateAttr

from api.core.plugin.semantic_version import SemanticVersion
from api.core.plugin.settings import Settings
from api.core.plugin.sys_platform import SysPlatform

class PluginIcons(BaseModel):
    dark: Optional[str] = None
    light: Optional[str] = None

class PluginMetadata(BaseModel):
    name: str
    version: SemanticVersion
    description: str
    repository: str
    icon_path: Optional[str] | Optional[PluginIcons] = None
    author: Optional[str]
    author_email: Optional[str]
    platform: SysPlatform
    _location: Optional[str] = PrivateAttr(default=None)
    _module: Optional[str] = PrivateAttr(default=None)
    _is_loaded: bool = PrivateAttr(default=False)
    _error: Optional[str] = PrivateAttr(default=None)


class Plugin(ABC):
    metadata: PluginMetadata
    settings: Optional[Settings] = None
    _module: str = "core"

    @abstractmethod
    def load(self):
        pass

    @abstractmethod
    def unload(self):
        pass

    def configure(self, settings: Settings):
        self.settings = settings
