import typing
from abc import abstractmethod
from typing import Callable

from mo.core.plugin.models.plugin import Plugin

# PicklableScalar is a type that can be serialized with pickle.
PicklableScalar = typing.Union[int, float, str, bool, None, bytes, bytearray]

# PicklableType is a recursive type that can represent any picklable structure,
PicklableType = typing.Union[
    PicklableScalar,
    list["PicklableType"],
    dict[str, "PicklableType"],
    tuple["PicklableType", ...],
    set["PicklableType"],
    frozenset["PicklableType"],
]


class CaptureData:
    """Class representing a single piece of captured data with a timestamp.
    Attributes:
        timestamp (float): The timestamp when the data was captured.
        data (PicklableType): The captured data, which can be any picklable type.
    """

    timestamp: float
    data: PicklableType

    def __init__(self, timestamp: float, data: PicklableType):
        self.timestamp = timestamp
        self.data = data


class CapturePlugin(Plugin):
    """Abstract base class for capture plugins.
    This class defines the interface for plugins that capture data during a session.
    It includes methods for preparing the plugin, starting and stopping the capture,
    pausing and resuming the capture, and saving the captured data.
    """

    _module_name: str = "capture"

    @abstractmethod
    def prepare(self, path: str, file_name: str) -> None:
        """Prepare the plugin with the given session path and file name.
        Args:
            path (str): The path to the session directory.
            file_name (str): The name of the file where captured data will be saved.
        """
        pass

    @abstractmethod
    def start(
        self,
        start_ts: float,
        get_timestamp: Callable[[], float],
        on_data: Callable[[CaptureData], None],
    ) -> None:
        """Start the capture process.
        This method is called to initiate the capture process, allowing the plugin to
        capture data asynchronously. The `on_data` callback must be called on every
        captured data with a `CaptureData` instance containing the timestamp and data.
        Args:
            start_ts (float): The timestamp when the capture starts.
            get_timestamp (Callable[[], float]): A callable that returns the current timestamp.
            on_data (Callable[[CaptureData], None]): A callback function to handle captured data.
        """
        pass

    @abstractmethod
    def pause(self, pause_ts: float) -> None:
        """Pause the capture process.
        This method is called to pause the capture process, allowing the plugin to
        temporarily stop capturing data.
        Args:
            pause_ts (float): The timestamp when the capture is paused.
        """
        pass

    @abstractmethod
    def resume(self, resume_ts: float) -> None:
        """Resume the capture process after it has been paused.
        This method is called to resume capturing data after a pause.
        Args:
            resume_ts (float): The timestamp when the capture is resumed.
        """
        pass

    @abstractmethod
    def stop(self, stop_ts: float) -> None:
        """Stop the capture process.
        This method is called to stop the capture process, allowing the plugin to
        finalize any captured data and prepare for saving the last data.
        Args:
            stop_ts (float): The timestamp when the capture is stopped.
        """
        pass

    @abstractmethod
    def save(self, data: list[CaptureData], end_of_data: bool = False) -> None:
        """Save the captured data.
        This method persists a batch of data captured by the plugin, received via the
        `on_data` callback during execution of the `start` method.
        The data is a list of `CaptureData` instances, ordered chronologically within
        a time window that may be fixed or dynamic.
        It is called periodically to store data incrementally. If `end_of_data` is True,
        this is the final batch.
        Args:
            data (list[CaptureData]): A list of `CaptureData` instances to be saved.
            end_of_data (bool): Indicates whether this is the final set of captured data.
                Defaults to False.
        """
        pass

    @abstractmethod
    def get_file_extension(self) -> str:
        """Get the file extension used by the plugin for saving captured data.
        Returns:
            str: The file extension used by the plugin, or an empty string if not applicable.
        """
        pass
