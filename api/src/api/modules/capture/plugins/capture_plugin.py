from abc import abstractmethod
from typing import Callable
import typing

from api.core.plugin.plugin import Plugin

PicklableScalar = typing.Union[int, float, str, bool, None, 
                               bytes, bytearray]

PicklableType = typing.Union[
    PicklableScalar,
    list['PicklableType'],
    dict[str, 'PicklableType'],
    tuple['PicklableType', ...],
    set['PicklableType'],
    frozenset['PicklableType'],
]

class CaptureData:
    timestamp: float
    data: PicklableType
    def __init__(self, timestamp: float, data: PicklableType):
        self.timestamp = timestamp
        self.data = data

class CapturePlugin(Plugin):
    _module_name: str = "capture"
    @abstractmethod
    def prepare(self, path: str, file_name: str) -> None:
        pass

    @abstractmethod
    def start(self, start_ts: float, get_timestamp: Callable[[], float], on_data: Callable[[CaptureData], None]) -> None:
        pass

    @abstractmethod
    def pause(self) -> None:
        pass

    @abstractmethod
    def resume(self) -> None:
        pass

    @abstractmethod
    def stop(self) -> None:
        pass

    @abstractmethod
    def save(self, data: list[CaptureData], end_of_data: bool = False) -> None:
        pass

    @abstractmethod
    def get_file_extension(self) -> str:
        pass
