from abc import ABC, abstractmethod
from typing import Optional

from api.core.plugin.semantic_version import SemanticVersion
from api.core.plugin.sys_platform import SysPlatform
from pydantic import BaseModel, PrivateAttr

class PluginMetadata(BaseModel):
    name: str
    version: SemanticVersion
    description: str
    repository: str
    icon_path: Optional[str] = None
    author: Optional[str]
    author_email: Optional[str]
    platform: SysPlatform
    _location: Optional[str] = PrivateAttr(default=None)
    _module: Optional[str] = PrivateAttr(default=None)
    _is_loaded: bool = PrivateAttr(default=False)
    _error: Optional[str] = PrivateAttr(default=None)

class Plugin(ABC):
    metadata: PluginMetadata
    _module: str = "core"

    @abstractmethod
    def load(self):
        pass

    @abstractmethod
    def unload(self):
        pass
