import multiprocessing
import threading
import time
from typing import Any, Optional

from mo.core.plugin.models.plugin import Plugin
from mo.core.plugin.worker_process import PluginProcessMetadata
from mo.modules.capture.plugins.capture_plugin import CaptureData, CapturePlugin
from mo.modules.capture.schemas.capture import PluginData

"""Module containing callback functions for CapturePlugin lifecycle events.
These callbacks are used to handle the preparation, starting, stopping,
pausing, resuming, and saving of capture plugins in a multi-process and multi-threaded
environment.
"""


def prepare_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    """Prepares the CapturePlugin instance with the provided session path and file name.
    This function is called before the plugin starts capturing data.
    Args:
        instance (Plugin): The CapturePlugin instance to prepare.
        extra_args (Optional[dict[str, Any]]): A dictionary containing additional arguments,
            including 'session_path' and 'file_name'.
    """
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    session_path = extra_args.get("session_path", "")
    file_name = extra_args.get("file_name", "")
    instance.prepare(session_path, file_name)


def start_callback(
    instance: Plugin,
    extra_args: Optional[dict[str, Any]],
    process_queue: Optional[multiprocessing.Queue],
    process_metadata: PluginProcessMetadata,
    *_,
):
    """Starts the CapturePlugin instance in a separate thread.
    This function is called to initiate the capture process, allowing the plugin to
    capture data asynchronously.
    Args:
        instance (Plugin): The CapturePlugin instance to start.
        extra_args (Optional[dict[str, Any]]): A dictionary containing additional arguments,
            including 'config_name' and 'start_ts'.
        process_queue (Optional[multiprocessing.Queue]): A queue for sending captured data
            to the main process.
        process_metadata (PluginProcessMetadata): Metadata about the plugin process,
            including the final ID.
    """
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return

    config_name = extra_args.get("config_name", "")

    def on_data_callback(data: CaptureData):
        try:
            if process_queue is not None:
                process_queue.put(
                    PluginData(
                        plugin_id=process_metadata.metadata.get_final_id(),
                        config_name=config_name,
                        timestamp=data.timestamp,
                        data=data.data,
                    ),
                    block=False,
                )
        except Exception as e:
            print(f"Error in on_data_callback for {config_name}: {e}")

    thread = threading.Thread(
        target=instance.start,
        args=(extra_args["start_ts"], time.monotonic, on_data_callback),
        daemon=True,
    )
    thread.start()


def stop_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    """Stops the CapturePlugin instance.
    This function is called to terminate the capture process and perform any necessary cleanup.
    Args:
        instance (Plugin): The CapturePlugin instance to stop.
        extra_args (Optional[dict[str, Any]]): A dictionary containing additional arguments,
            including 'stop_ts'.
    """
    if isinstance(instance, CapturePlugin) and extra_args is not None:
        stop_ts = extra_args.get("stop_ts", time.monotonic())
        instance.stop(stop_ts)


def pause_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    """Pauses the CapturePlugin instance.
    This function is called to temporarily halt the capture process.
    Args:
        instance (Plugin): The CapturePlugin instance to pause.
        extra_args (Optional[dict[str, Any]]): A dictionary containing additional arguments,
            including 'pause_ts'.
    """
    if isinstance(instance, CapturePlugin) and extra_args is not None:
        pause_ts = extra_args.get("pause_ts", time.monotonic())
        instance.pause(pause_ts)


def resume_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    """Resumes the CapturePlugin instance after a pause.
    This function is called to continue the capture process after it has been paused.
    Args:
        instance (Plugin): The CapturePlugin instance to resume.
        extra_args (Optional[dict[str, Any]]): A dictionary containing additional arguments,
            including 'resume_ts'.
    """
    if isinstance(instance, CapturePlugin) and extra_args is not None:
        resume_ts = extra_args.get("resume_ts", time.monotonic())
        instance.resume(resume_ts)


def get_file_extension_callback(instance: Plugin, *_) -> str:
    """Returns the file extension for the CapturePlugin instance.
    This function is called to determine the file format used by the plugin for saving captured data.
    Args:
        instance (Plugin): The CapturePlugin instance for which to get the file extension.
    Returns:
        str: The file extension used by the CapturePlugin instance, or an empty string if not applicable.
    """
    if isinstance(instance, CapturePlugin):
        return instance.get_file_extension()
    return ""


def save_callback(instance: Plugin, extra_args: Optional[dict[str, Any]], *_):
    """Saves the captured data from the CapturePlugin instance.
    This function is called to save the data captured by the plugin, allowing it to persist
    across sessions or for working with the captured data later.
    Args:
        instance (Plugin): The CapturePlugin instance from which to save data.
        extra_args (Optional[dict[str, Any]]): A dictionary containing additional arguments,
            including 'data' and 'end_of_data'.
    """
    if not isinstance(instance, CapturePlugin) or extra_args is None:
        return
    data = extra_args.get("data", [])
    # 'end_of_data' indicates whether the data being saved is the final set of captured data.
    end_of_data = extra_args.get("end_of_data", False)
    instance.save(data, end_of_data)
