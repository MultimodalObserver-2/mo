from abc import abstractmethod
from typing import Any, Generator

from api.core.plugin.plugin import Plugin


class CapturePlugin(Plugin):
    @abstractmethod
    def start(self, path: str, file_name: str):
        pass

    @abstractmethod
    def pause(self):
        pass

    @abstractmethod
    def resume(self):
        pass

    @abstractmethod
    def stop(self):
        pass
