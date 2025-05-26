from abc import abstractmethod
from typing import Any

from api.core.plugin.plugin import Plugin



class CapturePlugin(Plugin):
    @abstractmethod
    def start(self, path: str, file_name: str) -> Any:
        pass

    @abstractmethod
    def pause(self) -> Any:
        pass

    @abstractmethod
    def resume(self) -> Any:
        pass

    @abstractmethod
    def stop(self) -> Any:
        pass
