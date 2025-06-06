import multiprocessing
import threading
import time
from typing import Any, Optional
from api.core.plugin.plugin import Plugin
from api.core.plugin.plugin_worker_process import PluginProcessMetadata
from api.modules.capture.plugins.capture_plugin import CaptureData, CapturePlugin
from api.modules.capture.schemas.capture import PluginData


def prepare_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    session_path = extra_args.get("session_path", "")
    file_name = extra_args.get("file_name", "")
    instance.prepare(session_path, file_name)


def start_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], process_queue: Optional[multiprocessing.Queue], process_metadata: PluginProcessMetadata, *_):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return

    setting_name = extra_args.get("setting_name", "")

    def on_data_callback(data: CaptureData):
        try:
            if process_queue is not None:
                process_queue.put(PluginData(
                    plugin_id=process_metadata.metadata.get_final_id(),
                    setting_name=setting_name,
                    timestamp=data.timestamp,
                    data=data.data
                ), block=False)
        except Exception as e:
            print(f"Error in on_data_callback for {setting_name}: {e}")

    thread = threading.Thread(
        target=instance.start,
        args=(extra_args["start_ts"], time.monotonic, on_data_callback),
        daemon=True
    )
    thread.start()


def stop_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    if isinstance(instance, CapturePlugin) and extra_args is not None:
        stop_ts = extra_args.get("stop_ts", time.monotonic())
        instance.stop(stop_ts)


def pause_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    if isinstance(instance, CapturePlugin) and extra_args is not None:
        pause_ts = extra_args.get("pause_ts", time.monotonic())
        instance.pause(pause_ts)


def resume_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    if isinstance(instance, CapturePlugin) and extra_args is not None:
        resume_ts = extra_args.get("resume_ts", time.monotonic())
        instance.resume(resume_ts)


def get_file_extension_callback(instance: Plugin, *_):
    if isinstance(instance, CapturePlugin):
        return instance.get_file_extension()
    return ""


def save_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    data = extra_args.get("data", [])
    end_of_data = extra_args.get("end_of_data", False)
    instance.save(data, end_of_data)
