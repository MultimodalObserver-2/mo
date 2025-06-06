
from collections import defaultdict
import multiprocessing
import queue
import threading
from typing import Callable, Optional
from api.core.plugin.plugin_worker_process import PluginWorkerProcess
from api.core.utils.buffer import ListBuffer
from api.modules.capture.plugins.capture_plugin import CaptureData
from api.modules.capture.schemas.capture import PluginData
from api.modules.capture.services.capture_plugin_callbacks import save_callback
import psutil


class CaptureBufferManager:
    def __init__(self,
                 execution_lock: threading.Lock,
                 flush_interval: float = 1.0,
                 monitor_interval: float = 0.5,
                 memory_limit: int = 75,
                 swap_memory_limit: int = 25,
                 on_capture_data: Optional[Callable[[PluginData], None]] = None):
        self.buffers = defaultdict(ListBuffer[CaptureData])
        self.execution_lock = execution_lock
        self.flush_interval = flush_interval
        self.monitor_interval = monitor_interval
        self.memory_limit = memory_limit
        self.swap_memory_limit = swap_memory_limit
        self.started = False
        self.on_capture_data = on_capture_data
        self.paused_intervals = []  # type: list[tuple[float, float | None]]
        self.paused_intervals_lock = threading.Lock()

    def start(self, buffer_tuples: list[tuple[str, str]], queue: multiprocessing.Queue, processes: dict[str, PluginWorkerProcess]):
        self.queue = queue
        self.processes = processes
        self.buffers.clear()
        for plugin_id, setting_name in buffer_tuples:
            self.buffers[(plugin_id, setting_name)] = ListBuffer[CaptureData]()
        self.started = True
        self.captured_data_thread = threading.Thread(
            target=self.get_captured_data_worker,
            daemon=True
        )
        self.captured_data_thread.start()
        self.flush_buffers_thread = threading.Thread(
            target=self.flush_buffers_periodically_worker
        )
        self.flush_buffers_thread.start()
        self.stressed_monitor_thread = threading.Thread(
            target=self.stressed_monitor_worker
        )
        self.stressed_monitor_thread.start()

    def stop(self, timeout: Optional[float] = None):
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

    def get_captured_data_worker(self) -> None:
        while self.started:
            try:
                data = self.queue.get(timeout=0.1)
                if data is None or not isinstance(data, PluginData):
                    continue
                print(
                    f"Captured data: {data.plugin_id}, {data.setting_name}, {data.timestamp}")
                threading.Thread(
                    target=self.on_capture_data,
                    args=(data,),
                    daemon=True
                ).start()
                self.buffers[(data.plugin_id, data.setting_name)].add(
                    CaptureData(
                        timestamp=data.timestamp,
                        data=data.data,
                    )
                )
            except queue.Empty:
                continue

    def is_on_time(self, timestamp: float) -> bool:
        with self.paused_intervals_lock:
            for start, end in self.paused_intervals:
                if (start is None or timestamp >= start) and (end is None or timestamp <= end):
                    return False
            return True

    def flush_buffers(self, end_of_data: bool = False) -> dict[tuple[str, str], Exception]:
        exceptions = {}
        for (plugin_id, setting_name), buffer in self.buffers.items():
            if buffer.is_empty():
                continue
            try:
                process = self.processes.get(plugin_id)
                if process is None or not process.is_alive():
                    continue

                data = buffer.get_all_and_clear()
                filtered_data = [
                    item for item in data if self.is_on_time(item.timestamp)
                ]
                if not filtered_data and not end_of_data:
                    continue
                args = {
                    "data": filtered_data,
                    "end_of_data": end_of_data
                }
                with self.execution_lock:
                    process.execute_callback_on_instance(
                        setting_name, save_callback, args
                    )
            except Exception as e:
                exceptions[(plugin_id, setting_name)] = e
                print(
                    f"Error flushing buffer for {plugin_id}, {setting_name}: {e}")
        return exceptions

    def flush_buffers_periodically_worker(self) -> dict[tuple[str, str], list[Exception]]:
        all_exceptions = defaultdict(list)
        while self.started:
            try:
                if self.is_stressed():
                    continue
                print("Flushing buffers...")
                exceptions = self.flush_buffers()
                for key, exception in exceptions.items():
                    all_exceptions[key].append(exception)
                threading.Event().wait(self.flush_interval)
            except Exception as e:
                print(f"Error in flush_buffers_periodically_worker: {e}")
                all_exceptions[(
                    "all", "flush_buffers_periodically_worker")].append(e)
        return all_exceptions

    def is_stressed(self) -> bool:
        mem = psutil.virtual_memory()
        swap = psutil.swap_memory()
        return (mem.percent >= self.memory_limit or
                swap.percent >= self.swap_memory_limit)

    def stressed_monitor_worker(self) -> dict[tuple[str, str], list[Exception]]:
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
        while not self.queue.empty():
            try:
                data = self.queue.get_nowait()
                if data is None or not isinstance(data, PluginData):
                    threading.Event().wait(0.05)
                    continue
                self.buffers[(data.plugin_id, data.setting_name)].add(
                    CaptureData(
                        timestamp=data.timestamp,
                        data=data.data,
                    )
                )
                if self.queue.empty():
                    # Await a bit to ensure no more data is coming
                    threading.Event().wait(0.05)
            except queue.Empty:
                break
            except Exception as e:
                print(f"Error moving queue to buffers: {e}")

    def add_paused_interval(self, start: float, end: float | None):
        with self.paused_intervals_lock:
            self.paused_intervals.append((start, end))

    def clear_paused_intervals(self):
        with self.paused_intervals_lock:
            self.paused_intervals.clear()

    def get_paused_intervals(self) -> list[tuple[float, float | None]]:
        with self.paused_intervals_lock:
            return list(self.paused_intervals)

    def patch_last_paused_interval(self, start: float | None, end: float | None):
        with self.paused_intervals_lock:
            if self.paused_intervals:
                self.paused_intervals[-1] = (
                    start if start is not None else self.paused_intervals[-1][0],
                    end if end is not None else self.paused_intervals[-1][1]
                )
