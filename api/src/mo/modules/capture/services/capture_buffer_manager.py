import multiprocessing
import queue
import threading
from collections import defaultdict
from typing import Callable, Mapping, Optional

import psutil

from mo.core.plugin.worker_process import PluginWorkerProcess
from mo.core.utils.buffer import ListBuffer
from mo.modules.capture.plugins.capture_plugin import CaptureData
from mo.modules.capture.schemas.capture import PluginData
from mo.modules.capture.services.capture_plugin_callbacks import save_callback


class CaptureBufferManager:
    """Manages buffers for capturing data from multiple plugins.
    This class handles the collection, storage, and periodic flushing of captured data
    from various plugins, ensuring that data is processed efficiently and within memory limits.
    It also monitors system memory usage to prevent overloading and allows for pausing
    and resuming of data capture."""

    def __init__(
        self,
        execution_lock: threading.Lock,
        flush_interval: float = 1.0,
        monitor_interval: float = 0.5,
        memory_limit: int = 75,
        swap_memory_limit: int = 25,
        on_capture_data: Optional[Callable[[PluginData], None]] = None,
    ):
        """Initializes the CaptureBufferManager with the specified parameters."""
        self.buffers = defaultdict(ListBuffer[CaptureData])
        self.execution_lock = execution_lock
        self.flush_interval = flush_interval
        self.monitor_interval = monitor_interval
        self.memory_limit = memory_limit
        self.swap_memory_limit = swap_memory_limit
        self.started = False
        self.last_pause = None
        self.on_capture_data = on_capture_data
        self.paused_intervals = []  # type: list[tuple[float, float | None]]
        self.paused_intervals_lock = threading.Lock()

    def start(
        self,
        buffer_tuples: list[tuple[str, str]],
        queue: multiprocessing.Queue,
        processes: Mapping[str, PluginWorkerProcess],
    ):
        """Starts the CaptureBufferManager with the given buffer configurations and queue.
        Args:
            buffer_tuples (list[tuple[str, str]]): A list of tuples containing plugin IDs and configuration names.
            queue (multiprocessing.Queue): A queue for receiving captured data from plugins.
            processes (Mapping[str, PluginWorkerProcess]): A mapping of plugin IDs to their corresponding worker processes.
        """
        self.queue = queue
        self.processes = processes
        self.last_pause = None
        self.buffers.clear()
        for plugin_id, config_name in buffer_tuples:
            self.buffers[(plugin_id, config_name)] = ListBuffer[CaptureData]()
        self.started = True
        self.captured_data_thread = threading.Thread(
            target=self.get_captured_data_worker, daemon=True
        )
        self.captured_data_thread.start()
        self.flush_buffers_thread = threading.Thread(target=self.flush_buffers_periodically_worker)
        self.flush_buffers_thread.start()
        self.stressed_monitor_thread = threading.Thread(target=self.stressed_monitor_worker)
        self.stressed_monitor_thread.start()

    def stop(self, timeout: Optional[float] = None):
        """Stops the CaptureBufferManager and flushes all buffers.
        Args:
            timeout (Optional[float]): The maximum time to wait for threads to finish.
        """
        self.started = False
        if self.captured_data_thread.is_alive():
            self.captured_data_thread.join(timeout=timeout)
        if self.flush_buffers_thread.is_alive():
            self.flush_buffers_thread.join(timeout=timeout)
        if self.stressed_monitor_thread.is_alive():
            self.stressed_monitor_thread.join(timeout=timeout)
        self.move_queue_to_buffers()
        self.queue.close()
        self.queue.join_thread()
        self.flush_buffers(end_of_data=True)

    def get_captured_data_worker(self):
        """Worker thread that continuously retrieves captured data from the queue
        and adds it to the appropriate buffer.
        Also, it starts a new thread for execute the on_capture_data callback
        """
        while self.started:
            try:
                data = self.queue.get(timeout=0.1)
                if data is None or not isinstance(data, PluginData):
                    continue
                threading.Thread(target=self.on_capture_data, args=(data,), daemon=True).start()
                self.buffers[(data.plugin_id, data.config_name)].add(
                    CaptureData(
                        timestamp=data.timestamp,
                        data=data.data,
                    )
                )
            except queue.Empty:
                continue

    def is_on_time(self, timestamp: float) -> bool:
        """Checks if the given timestamp is within the allowed time intervals.
        Args:
            timestamp (float): The timestamp to check.
        Returns:
            bool: True if the timestamp is within the allowed intervals, False otherwise.
        """
        with self.paused_intervals_lock:
            for start, end in self.paused_intervals:
                if (start is None or timestamp >= start) and (end is None or timestamp <= end):
                    return False
            return True

    def flush_buffers(self, end_of_data: bool = False) -> dict[tuple[str, str], Exception]:
        """Flushes the buffers for all plugins, executing the save callback for each plugin buffer.
        Args:
            end_of_data (bool): If True, indicates that no more data will be added to the buffers.
        Returns:
            dict[tuple[str, str], Exception]: A dictionary mapping (plugin_id, config_name) to any exceptions raised during flushing.
        """
        exceptions = {}
        for (plugin_id, config_name), buffer in self.buffers.items():
            if buffer.is_empty():
                continue
            try:
                process = self.processes.get(plugin_id)
                if process is None or not process.is_alive():
                    continue

                data = buffer.get_all_and_clear()
                filtered_data = [item for item in data if self.is_on_time(item.timestamp)]
                if not filtered_data and not end_of_data:
                    continue
                args = {"data": filtered_data, "end_of_data": end_of_data}
                with self.execution_lock:
                    process.execute_callback_on_instance(config_name, save_callback, args)
            except Exception as e:
                exceptions[(plugin_id, config_name)] = e
                print(f"Error flushing buffer for {plugin_id}, {config_name}: {e}")
        return exceptions

    def flush_buffers_periodically_worker(self) -> dict[tuple[str, str], list[Exception]]:
        """Periodically flushes the buffers to ensure data is saved and processed.
        This worker runs in a separate thread and checks the buffers at regular intervals.
        Returns:
            dict[tuple[str, str], list[Exception]]: A dictionary mapping (plugin_id, config_name) to lists of exceptions raised during flushing.
        """
        all_exceptions = defaultdict(list)
        while self.started:
            try:
                if self.is_stressed():
                    continue
                exceptions = self.flush_buffers()
                for key, exception in exceptions.items():
                    all_exceptions[key].append(exception)
                threading.Event().wait(self.flush_interval)
            except Exception as e:
                print(f"Error in flush_buffers_periodically_worker: {e}")
                all_exceptions[("all", "flush_buffers_periodically_worker")].append(e)
        return all_exceptions

    def is_stressed(self) -> bool:
        """Checks if the system is under stress based on memory and swap usage.
        Returns:
            bool: True if the system is stressed (memory or swap usage exceeds limits), False otherwise.
        """
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        return mem.percent >= self.memory_limit or swap.percent >= self.swap_memory_limit

    def stressed_monitor_worker(self) -> dict[tuple[str, str], list[Exception]]:
        """Monitors the system for stress conditions and flushes buffers if stressed.
        This worker runs in a separate thread and checks the system memory and swap usage at regular intervals.
        Returns:
            dict[tuple[str, str], list[Exception]]: A dictionary mapping (plugin_id, config_name) to lists of exceptions raised during monitoring.
        """
        all_exceptions = defaultdict(list)
        while self.started:
            try:
                if self.is_stressed():
                    exceptions = self.flush_buffers(end_of_data=False)
                    for key, exception in exceptions.items():
                        all_exceptions[key].append(exception)
                threading.Event().wait(self.monitor_interval)
            except Exception as e:
                print(f"Error in stressed_monitor_worker: {e}")
                all_exceptions[("all", "stressed_monitor_worker")].append(e)
        return all_exceptions

    def move_queue_to_buffers(self):
        """Moves all data from the queue to the buffers.
        This method is called to ensure that any remaining data in the queue is processed
        and added to the appropriate buffers before stopping the manager.
        If the queue is empty, it waits briefly to ensure no more data is coming.
        """
        while not self.queue.empty():
            try:
                data = self.queue.get_nowait()
                if data is None or not isinstance(data, PluginData):
                    threading.Event().wait(0.05)
                    continue
                self.buffers[(data.plugin_id, data.config_name)].add(
                    CaptureData(
                        timestamp=data.timestamp,
                        data=data.data,
                    )
                )
                if self.queue.empty():
                    # Await a bit to ensure no more data is coming
                    threading.Event().wait(0.05)
            except Exception as e:
                print(f"Error moving queue to buffers: {e}")

    def pause(self, ts: float):
        """Pauses the capture process at the given timestamp.
        Args:
            ts (float): The timestamp at which to pause the capture.
        """
        self.last_pause = ts

    def resume(self, ts: float):
        """Resumes the capture process at the given timestamp.
        Args:
            ts (float): The timestamp at which to resume the capture.
        """
        if self.last_pause is not None:
            self.add_paused_interval(self.last_pause, ts)
            self.last_pause = None

    def add_paused_interval(self, start: float, end: float | None):
        """Adds a paused interval to the list of paused intervals.
        Args:
            start (float): The start timestamp of the paused interval.
            end (float | None): The end timestamp of the paused interval, or None if it is still ongoing.
        """
        with self.paused_intervals_lock:
            self.paused_intervals.append((start, end))

    def clear_paused_intervals(self):
        """Clears all paused intervals.
        This method is used to reset the list of paused intervals,
        typically when the capture process is restarted or stopped.
        """
        with self.paused_intervals_lock:
            self.paused_intervals.clear()

    def get_paused_intervals(self) -> list[tuple[float, float | None]]:
        """Returns a copy of the list of paused intervals.
        This method is thread-safe and ensures that the current state of paused intervals
        is returned without being affected by concurrent modifications.
        Returns:
            list[tuple[float, float | None]]: A list of tuples representing paused intervals,
                where each tuple contains the start and end timestamps.
        """
        with self.paused_intervals_lock:
            paused_intervals_copy = self.paused_intervals.copy()
            if self.last_pause is not None:
                paused_intervals_copy.append((self.last_pause, None))
            return paused_intervals_copy

    def patch_last_paused_interval(self, start: float | None, end: float | None):
        """Patches the last paused interval with the given start and end timestamps.
        This method updates the most recent paused interval with new start and/or end values.
        Args:
            start (float | None): The new start timestamp for the last paused interval, or None to keep the existing start.
            end (float | None): The new end timestamp for the last paused interval, or None to keep the existing end.
        """
        with self.paused_intervals_lock:
            if self.paused_intervals:
                self.paused_intervals[-1] = (
                    start if start is not None else self.paused_intervals[-1][0],
                    end if end is not None else self.paused_intervals[-1][1],
                )
