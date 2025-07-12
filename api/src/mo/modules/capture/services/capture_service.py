import asyncio
import logging
import multiprocessing
import threading
import time
from datetime import datetime

from mo.core.api.schemas.plugin import PluginRes
from mo.core.config import constants
from mo.core.file_management.file_management import FileManagement
from mo.core.plugin.manager import PluginManager
from mo.core.plugin.models.settings import Settings
from mo.core.plugin.worker_process import PluginWorkerProcess
from mo.core.utils.http_exceptions import BadRequestException
from mo.core.utils.singleton import singleton
from mo.modules.capture.plugins.capture_plugin import CapturePlugin
from mo.modules.capture.schemas.capture import CaptureStatusResponse, PluginData
from mo.modules.capture.schemas.session import (
    CaptureConfigDetailsPost,
    SessionPost,
    SessionPut,
    SessionRes,
)
from mo.modules.capture.services import config_service
from mo.modules.capture.services.capture_buffer_manager import CaptureBufferManager
from mo.modules.capture.services.capture_plugin_callbacks import (
    get_file_extension_callback,
    pause_callback,
    prepare_callback,
    resume_callback,
    start_callback,
    stop_callback,
)
from mo.modules.capture.services.config_service import CaptureConfigService
from mo.modules.capture.services.session_service import SessionService
from mo.core.utils.i18n import translate


@singleton
class CaptureService:
    """Service to manage capture sessions and plugins, including starting, stopping, and pausing captures.
    This service handles the lifecycle of capture plugins, manages the capture buffer, and interacts with
    the session service to create and update capture sessions.
    It also provides methods to retrieve available capture plugins and their configurations.
    It uses a singleton pattern to ensure that only one instance of the service exists throughout the application.
    """

    FLUSH_INTERVAL = 1.0  # seconds
    MONITOR_INTERVAL = 0.5  # seconds
    MEMORY_LIMIT = 75  # Memory usage limit in percentage
    SWAP_MEMORY_LIMIT = 25  # Swap memory usage limit in percentage

    def __init__(self):
        """Initialize the CaptureService with necessary components and configurations."""
        self.session_service = SessionService()
        self.plugin_management = PluginManager()
        self.config_service = CaptureConfigService()
        self._initialize()
        # Lock to ensure thread-safe execution of callbacks
        self.execute_lock = threading.Lock()
        # CaptureBufferManager to manage the capture data buffer and its flushing
        self.capture_buffer_manager = CaptureBufferManager(
            execution_lock=self.execute_lock,
            flush_interval=self.FLUSH_INTERVAL,
            monitor_interval=self.MONITOR_INTERVAL,
            memory_limit=self.MEMORY_LIMIT,
            swap_memory_limit=self.SWAP_MEMORY_LIMIT,
            on_capture_data=self.on_capture_data_callback,
        )
        self.logger = logging.getLogger(constants.LOGGER_NAME)

    def _initialize(self):
        """Reset the internal state of the CaptureService."""
        # A dictionary to hold running processes, mapping plugin IDs to their worker processes
        self.running_processes = {}  # type: dict[str, PluginWorkerProcess]
        # A dictionary to hold instances of processes, mapping plugin IDs to a list of instances
        # identified by their configuration names
        self.processes_instances = {}  # type: dict[str, list[str]]
        self.configs_names = {}  # type: dict[tuple[str, str], str]
        self.started = False
        self.paused = False
        self.project_name = None  # type: str | None
        self.participant_code = None  # type: str | None
        self.session = None  # type: SessionRes | None
        self.start_ts = 0.0
        self.paused_ts = 0.0
        self.paused_time = 0.0
        # A dictionary to hold the first timestamp for each configuration name
        self.first_timestamp = {}  # type: dict[str, float]

    def _format_data_file_name(self, file_name: str) -> str:
        """Format the file name for capture data by normalizing it to lower case,
        replacing spaces with underscores, and normalizing the file name.
        Args:
            file_name (str): The original file name to format.
        Returns:
            str: The formatted file name.
        """
        file_name = file_name.lower()
        file_name = file_name.replace(" ", "_")
        file_name = FileManagement.normalize_file_name(file_name)
        return file_name

    def get_capture_plugins(self) -> list[PluginRes]:
        """Retrieve a list of available capture plugins.
        Returns:
            list[PluginRes]: A list of PluginRes objects representing the available capture plugins.
        """
        plugins_metadata = self.plugin_management.get_plugins_metadata_from_type(
            CapturePlugin)
        plugins_res = [
            PluginRes.from_plugin_metadata(plugin_metadata) for plugin_metadata in plugins_metadata
        ]
        return plugins_res

    async def exec_prepare_callback(self, session_path: str):
        """Execute the prepare callback for all running processes and their instances.
        This method iterates through all running processes and their instances,
        executing the prepare callback with the provided session path and file name.
        Args:
            session_path (str): The path to the session where the capture data will be stored.
        """
        valid_processes_instances = self.processes_instances.copy()
        for key, process in self.running_processes.items():
            for config_id in self.processes_instances[key]:
                file_name = self._format_data_file_name(
                    self.configs_names.get((key, config_id), ""))
                extra_args = {"session_path": session_path,
                              "file_name": file_name}
                try:
                    await asyncio.to_thread(process.execute_callback_on_instance,
                                            config_id, prepare_callback, extra_args)
                except Exception as e:
                    self.logger.error(
                        f"[CaptureService] Error executing prepare callback for {config_id} in process {key}: {e}"
                    )
                    valid_processes_instances[key].remove(config_id)
                    await asyncio.to_thread(process.remove_plugin_instance, config_id)
        self.processes_instances = valid_processes_instances

    async def exec_start_callback(self):
        """Execute the start callback for all running processes and their instances.
        This method iterates through all running processes and their instances,
        executing the start callback with the start timestamp and configuration name.
        """
        for key, process in self.running_processes.items():
            for config_id in self.processes_instances[key]:
                extra_args = {
                    "config_id": config_id,
                    "start_ts": self.start_ts,
                }
                try:
                    await asyncio.to_thread(process.execute_callback_on_instance,
                                            config_id, start_callback, extra_args)
                except Exception as e:
                    self.logger.error(
                        f"[CaptureService] Error executing start callback for {config_id} in process {key}: {e}",
                        exc_info=True,
                    )

    async def start_capture(self, project_name: str, participant_code: str):
        """Start a capture session for the specified project and participant.
        This method initializes the capture session, loads the necessary processes,
        and starts the capture buffer manager.
        Args:
            project_name (str): The name of the project for which the capture is being started.
            participant_code (str): The code of the participant for whom the capture is being started.
        Raises:
            BadRequestException: If the capture is already started or if no capture configurations are loaded.
        """
        if self.started:
            raise BadRequestException(translate("capture.alreadyStarted"))
        processes_queue = await self.load_processes(project_name)
        if len(self.running_processes) == 0:
            raise BadRequestException(
                translate("capture.noConfigurationsLoaded"))
        self.start_ts = time.monotonic()
        self.project_name = project_name
        self.participant_code = participant_code
        self.session = self.session_service.create_session(
            project_name,
            participant_code,
            SessionPost(
                start_timestamp=self.start_ts,
                started_at=datetime.now(),
                capture_sources=self._get_capture_configs(project_name),
            ),
        )
        await self.exec_prepare_callback(self.session.location)
        await self.exec_start_callback()
        self.started = True
        self.paused = False
        self.capture_buffer_manager.clear_paused_intervals()
        buffer_tuples = []
        for key, configs in self.processes_instances.items():
            for config_id in configs:
                buffer_tuples.append((key, config_id))
        self.capture_buffer_manager.start(
            buffer_tuples, processes_queue, self.running_processes)

    def on_capture_data_callback(self, data: PluginData):
        """Callback function to handle capture data from plugins.
        This method is called when a plugin sends capture data.
        It checks if the data is for a new configuration and starts a thread to add the capture source setting start timestamp.
        Args:
            data (PluginData): The data received from the plugin, containing configuration name and timestamp.
        """
        if data.config_id not in self.first_timestamp and self.session is not None:
            self.first_timestamp[data.config_id] = data.timestamp
            threading.Thread(
                target=self.session_service.add_capture_source_setting_start_timestamp,
                args=(
                    self.project_name or "",
                    self.participant_code or "",
                    self.session.session_id,
                    data.config_id,
                    data.timestamp,
                ),
            ).start()

    async def exec_stop_callback(self, stop_ts: float):
        """Execute the stop callback for all running processes and their instances.
        This method iterates through all running processes and executes the stop callback
        with the provided stop timestamp.
        Args:
            stop_ts (float): The timestamp when the capture session is stopped.
        Returns:
            dict: A dictionary containing exceptions raised during the execution of stop callbacks,
            keyed by plugin process ID.
        """
        exceptions = {}
        for key, process in self.running_processes.items():
            try:
                await asyncio.to_thread(process.execute_callback_on_all_instances,
                                        stop_callback, {"stop_ts": stop_ts})
            except Exception as e:
                self.logger.error(
                    f"[CaptureService] Error executing stop callback for plugin process {key}: {e}",
                    exc_info=True,
                )
                exceptions[key] = e
        return exceptions

    async def stop_capture(self):
        """Stop the capture session safely.
        This method stops the capture session, executes the stop callback for all running processes,
        updates the session with the final duration and paused intervals, and unloads the running processes.
        Raises:
            BadRequestException: If the capture is not started, or if there are errors during the stop process.
        """
        if not self.started:
            raise BadRequestException(translate("capture.notStarted"))
        self.started = False
        self.paused = False
        stop_ts = time.monotonic()
        stop_datetime = datetime.now()
        self.capture_buffer_manager.add_paused_interval(stop_ts, None)
        exceptions = await self.exec_stop_callback(stop_ts)
        if self.session and self.project_name and self.participant_code:
            duration = stop_ts - self.start_ts - self.paused_time
            self.session.duration = duration
            self.session.end_timestamp = stop_ts
            self.session.ended_at = stop_datetime
            self.session.paused_time = self.paused_time
            session_put = SessionPut.from_session_res(self.session)
            session_put.capture_sources = []
            session_put.paused_intervals = self.capture_buffer_manager.get_paused_intervals()
            # Remove the last interval which is stop_ts, None
            session_put.paused_intervals.pop()
            self.session_service.update_session(
                self.project_name, self.participant_code, self.session.session_id, session_put
            )

        await asyncio.to_thread(self.capture_buffer_manager.stop, timeout=2)
        await self.unload_running_processes()
        self._initialize()
        if len(exceptions) > 0:
            raise BadRequestException(translate("capture.failedToStop"))

    async def pause_capture(self):
        """Pause the capture session.
        This method pauses the capture session, updates the capture buffer manager,
        and executes the pause callback for all running processes.
        Raises:
            BadRequestException: If the capture is not started or already paused.
        """
        if not self.started or self.paused:
            raise BadRequestException(
                translate("capture.notStartedOrAlreadyPaused"))
        self.paused_ts = time.monotonic()
        self.capture_buffer_manager.pause(self.paused_ts)
        with self.execute_lock:
            for process in self.running_processes.values():
                try:
                    await asyncio.to_thread(process.execute_callback_on_all_instances,
                                            pause_callback, {"pause_ts": self.paused_ts}, need_response=False
                                            )
                except Exception as e:
                    self.logger.error(
                        f"[CaptureService] Error executing pause callback for process {process.process_metadata.metadata.plugin_id}: {e}",
                        exc_info=True,
                    )

        self.paused = True

    async def resume_capture(self):
        """Resume the paused capture session.
        This method resumes the capture session, updates the capture buffer manager,
        and executes the resume callback for all running processes.
        Raises:
            BadRequestException: If the capture is not started or not paused.
        """
        if not self.started or not self.paused:
            raise BadRequestException(translate("capture.notStartedOrNotPaused"))
        resume_ts = time.monotonic()
        self.capture_buffer_manager.resume(resume_ts)
        with self.execute_lock:
            for process in self.running_processes.values():
                try:
                    await asyncio.to_thread(process.execute_callback_on_all_instances,
                        resume_callback,
                        {
                            "resume_ts": resume_ts,
                        },
                        need_response=False,
                    )
                except Exception as e:
                    self.logger.error(
                        f"[CaptureService] Error executing resume callback for process {process.process_metadata.metadata.plugin_id}: {e}",
                        exc_info=True,
                    )

        self.paused_time += resume_ts - self.paused_ts
        self.paused_ts = 0.0
        self.paused = False

    def get_capture_plugin_file_name(self, plugin_id: str, config_id: str) -> str:
        """Get the file name for the capture plugin data based on the plugin ID and configuration name.
        This method retrieves the file extension from the plugin's instance and formats the file name accordingly.
        Args:
            plugin_id (str): The ID of the plugin for which the file name is being generated.
            config_id (str): The id of the configuration for which the file name is being generated.
        Returns:
            str: The formatted file name for the capture plugin data.
        Raises:
            BadRequestException: If no running process is found for the given plugin ID.
        """
        process = self.running_processes.get(plugin_id)
        if process is None:
            raise BadRequestException(
                translate("capture.noRunningProcess", plugin_id=plugin_id))
        file_extension = process.execute_callback_on_instance(
            config_id, get_file_extension_callback
        )
        file_name = self._format_data_file_name(
            self.configs_names.get((plugin_id, config_id), ""))
        if not file_extension:
            return file_name
        file_extension = file_extension.lstrip(".").lower()
        return f"{file_name}.{file_extension}"

    def _get_capture_configs(self, project_name: str) -> list[CaptureConfigDetailsPost]:
        """Retrieve the capture configurations for the specified project.
        This method fetches all loaded capture configurations for the given project name
        and formats them into a list of CaptureConfigDetailsPost objects.
        Args:
            project_name (str): The name of the project for which the capture configurations are being retrieved.
        Returns:
            list[CaptureConfigDetailsPost]: A list of CaptureConfigDetailsPost objects representing the capture configurations.
        """
        configs = self.config_service.get_all_configs_loaded(project_name)
        capture_configs = []
        for config in configs:
            file_name = self.get_capture_plugin_file_name(
                config.plugin_id, config.id)
            file_extension = file_name.split(
                ".")[-1] if "." in file_name else ""
            capture_configs.append(
                CaptureConfigDetailsPost(
                    config_id=config.id,
                    config_name=config.name,
                    plugin_id=config.plugin_id,
                    plugin_name=config.plugin_metadata.name,
                    plugin_version=str(config.plugin_metadata.version),
                    settings=config.settings,
                    file_extension=file_extension,
                    file_name=file_name,
                )
            )
        return capture_configs

    async def load_processes(self, project_name: str) -> multiprocessing.Queue:
        """Load the capture processes for the specified project.
        This method retrieves all capture configurations for the given project name,
        initializes the necessary plugin worker processes, and prepares them for capturing data.
        Args:
            project_name (str): The name of the project for which the capture processes are being loaded.
        Returns:
            multiprocessing.Queue: A queue for inter-process communication with the loaded processes.
        Raises:
            BadRequestException: If no capture configurations are loaded for the project.
        """
        configs = self.config_service.get_all_configs_loaded(project_name)
        processes_queue = multiprocessing.Queue()
        self.running_processes = {}
        for config in configs:
            if self.running_processes.get(config.plugin_id) is None:
                plugin_process = await asyncio.to_thread(self.plugin_management.get_active_plugin_process,
                                                         config.plugin_id, processes_queue)
                if plugin_process is None:
                    continue
                self.running_processes[config.plugin_id] = plugin_process
                self.processes_instances[config.plugin_id] = []
            await asyncio.to_thread(
                self.running_processes[config.plugin_id].add_plugin_instance,
                config.id, Settings(config.settings))
            self.configs_names[(config.plugin_id, config.id)] = config.name
            self.processes_instances[config.plugin_id].append(config.id)
        return processes_queue

    async def unload_running_processes(self):
        """Unload all running processes and reset the internal state of the CaptureService.
        This method stops all running processes, clears the internal state, and prepares the service for a new capture session.
        It ensures that all processes are stopped gracefully, and any resources are released.
        """
        for process in self.running_processes.values():
            await asyncio.to_thread(process.stop, timeout=10, force=True)

    def is_capturing(self) -> bool:
        """Check if the capture session is currently active.
        Returns:
            bool: True if the capture session is started, False otherwise.
        """
        return self.started

    def is_paused(self) -> bool:
        """Check if the capture session is currently paused.
        Returns:
            bool: True if the capture session is paused, False otherwise.
        """
        return self.paused

    def get_status(self) -> CaptureStatusResponse:
        """Get the current status of the capture session.
        Returns:
            CaptureStatusResponse: An object containing the status of the capture session,
            including whether it is started, paused, and the project name and participant code.
        """
        return CaptureStatusResponse(
            started=self.started,
            paused=self.paused,
            project_name=self.project_name,
            participant_code=self.participant_code,
        )
