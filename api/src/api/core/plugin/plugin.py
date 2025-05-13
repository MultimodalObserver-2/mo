from abc import ABC, abstractmethod
from typing import Optional

from api.core.plugin.semantic_version import SemanticVersion
from api.core.plugin.sys_platform import SysPlatform


class Plugin(ABC):
    name: str
    version: SemanticVersion
    description: str
    repo: str
    author: Optional[str]
    author_email: Optional[str]
    platform: SysPlatform
    _module: str = "core"

    @abstractmethod
    def load(self):
        pass

    @abstractmethod
    def unload(self):
        pass
