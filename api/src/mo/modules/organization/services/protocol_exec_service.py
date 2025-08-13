import asyncio
from contextlib import suppress
from typing import Iterable, Optional

from fastapi import WebSocket

from mo.core.file_management.file_management import FileManagement
from mo.core.utils.http_exceptions import BadRequestException
from mo.modules.organization.errors.protocols import invalid_execution_request
from mo.modules.organization.schemas.protocol import Activity, ProtocolExecMsg
from mo.modules.organization.services.protocol_service import ProtocolService


class ProtocolExecService:
    """Service to handle protocol execution logic."""

    def __init__(self):
        """Initialize the ProtocolExecService."""
        self.protocol_service = ProtocolService()
        self._running_event = asyncio.Event()
        self._running_event.set()

    async def _send_status(self, websocket: WebSocket, status: str):
        """
        Send a status message to the WebSocket.
        Args:
            websocket (WebSocket): The WebSocket connection.
            status (str): The status message to send.
        """
        msg = ProtocolExecMsg(
            activity_name=None,
            activity_num=None,
            message=status,
            message_type="status",
            show_timer=False,
            total_activities=0,
            has_time_limit=False,
        )
        await websocket.send_json(msg.model_dump())

    async def _handle_control_message(self, websocket: WebSocket, text: str) -> Optional[str]:
        """
        Handle control messages "pause" and "resume".
        Args:
            websocket (WebSocket): The WebSocket connection.
            text (str): The control message text.
        Returns:
            Optional[str]: Returns None if the message is a control command, otherwise returns the text.
        Raises:
            BadRequestException: If the control message is invalid.
        """
        if text == "pause":
            if self._running_event.is_set():
                self._running_event.clear()
                await self._send_status(websocket, "paused")
            return None
        elif text == "resume":
            if not self._running_event.is_set():
                self._running_event.set()
                await self._send_status(websocket, "resumed")
            return None
        return text

    async def _receive_until(
        self,
        websocket: WebSocket,
        expected: Iterable[str],
        activity_name: Optional[str] = None,
        allow_pause: bool = True,
    ) -> str:
        """
        Receive messages from the WebSocket until one of the expected messages is received.
        Allows for pause and resume commands if `allow_pause` is True.
        Args:
            websocket (WebSocket): The WebSocket connection.
            expected (Iterable[str]): A set of expected messages to receive.
            allow_pause (bool): Whether to allow pause and resume commands.
        Returns:
            str: The received message that matches one of the expected messages.
        Raises:
            BadRequestException: If an unexpected message is received.
        """
        expected_set = set(expected)
        while True:
            text = await websocket.receive_text()
            if allow_pause and text in {"pause", "resume"}:
                await self._handle_control_message(websocket, text)
                continue
            if text in expected_set:
                return text
            raise BadRequestException(
                invalid_execution_request(activity_name=activity_name if activity_name else "unknown"))
        
    async def _tick_or_control(self, websocket: WebSocket, activity_name: str, seconds: float) -> None:
        """
        Wait for a specified number of seconds or until a control message is received.
        If a control message is received, it will be handled accordingly.
        The method supports pausing and resuming the timer, where only the remaining time will be waited upon resume.
        
        Args:
            websocket (WebSocket): The WebSocket connection.
            activity_name (str): The name of the activity being executed.
            seconds (float): The number of seconds to wait.
            
        Raises:
            BadRequestException: If the execution request is invalid.
        """
        # If already paused, wait for resume
        if not self._running_event.is_set():
            while not self._running_event.is_set():
                text = await websocket.receive_text()
                await self._handle_control_message(websocket, text)
        
        remaining_time = seconds
        
        while remaining_time > 0:
            start_time = asyncio.get_event_loop().time()
            
            sleep_task = asyncio.create_task(asyncio.sleep(remaining_time))
            recv_task = asyncio.create_task(websocket.receive_text())
            
            # Wait for either sleep completion or a message
            done, _ = await asyncio.wait(
                {sleep_task, recv_task}, return_when=asyncio.FIRST_COMPLETED
            )
            
            elapsed = asyncio.get_event_loop().time() - start_time
            remaining_time -= elapsed
            
            if sleep_task in done:
                if not recv_task.done():
                    recv_task.cancel()
                    with suppress(asyncio.CancelledError):
                        await recv_task
                return
            
            if not sleep_task.done():
                sleep_task.cancel()
            
            # Process the received message
            text = recv_task.result()
            handled = await self._handle_control_message(websocket, text)
            
            if handled is not None:
                raise BadRequestException(
                    invalid_execution_request(activity_name=activity_name))
            
            # If paused, wait until resumed
            if not self._running_event.is_set():
                while not self._running_event.is_set():
                    text = await websocket.receive_text()
                    await self._handle_control_message(websocket, text)

    async def run(self, websocket: WebSocket, protocol_name: str, project_name: str):
        """Run the protocol execution process.
        Args:
            websocket (WebSocket): The WebSocket connection.
            protocol_name (str): The name of the protocol to execute.
            project_name (str): The name of the project.
        Raises:
            BadRequestException: If the execution request is invalid.
        """
        protocol = self.protocol_service.get_protocol(project_name, protocol_name)
        activities = protocol.activities
        for activity in activities:
            await self.run_activity(websocket, activity, len(activities))
        finish_msg = ProtocolExecMsg(message="Protocol finished", message_type="finish")
        await websocket.send_json(finish_msg.model_dump())

    async def run_activity(self, websocket: WebSocket, activity: Activity, total_activities: int):
        """Run a single activity in the protocol.
        Args:
            websocket (WebSocket): The WebSocket connection.
            activity (Activity): The activity to execute
            total_activities (int): The total number of activities in the protocol.
        Raises:
            BadRequestException: If the execution request is invalid.
        """
        await self.handle_start(websocket, activity, total_activities)
        await self.handle_activity_execution(websocket, activity)
        await self.handle_end(websocket, activity, total_activities)

    async def handle_start(self, websocket: WebSocket, activity: Activity, total_activities: int):
        """Handle the start of an activity, including opening any processes.
        Args:
            websocket (WebSocket): The WebSocket connection.
            activity (Activity): The activity to execute
            total_activities (int): The total number of activities in the protocol.
        Raises:
            BadRequestException: If the execution request is invalid.
        """
        msg = ProtocolExecMsg(
            activity_name=activity.name,
            activity_num=activity.order,
            message=activity.start_message,
            message_type="start",
            show_timer=activity.show_timer,
            total_activities=total_activities,
            has_time_limit=activity.has_time_limit,
        )
        await websocket.send_json(msg.model_dump())
        await self._receive_until(
            websocket,
            expected=["start"],
            activity_name=activity.name,
            allow_pause=True
        )

    async def handle_activity_execution(self, websocket: WebSocket, activity: Activity):
        """Handle the execution of an activity.
        Args:
            websocket (WebSocket): The WebSocket connection.
            activity (Activity): The activity to execute
        Raises:
            BadRequestException: If the execution request is invalid.
        """
        if activity.path:
            FileManagement().open_file(activity.path)

        if activity.has_time_limit and activity.show_timer:
            await self.send_timer(websocket, activity)
        elif activity.has_time_limit:
            await self._tick_or_control(
                websocket,
                activity_name=activity.name,
                seconds=activity.time_limit
            )
        else:
            await self._receive_until(
                websocket,
                expected=["completed"],
                activity_name=activity.name,
                allow_pause=True)

    async def send_timer(self, websocket: WebSocket, activity: Activity):
        """Send a countdown timer to the WebSocket.
        Args:
            websocket (WebSocket): The WebSocket connection.
            activity (Activity): The activity in which the timer is running.
        """
        msg = ProtocolExecMsg(
            activity_name=activity.name,
            activity_num=activity.order,
            message="",
            message_type="timer",
            show_timer=activity.show_timer,
            total_activities=0,
            has_time_limit=True,
        )
        for remaining in range(activity.time_limit, -1, -1):
            msg.message = str(remaining)
            await websocket.send_json(msg.model_dump())
            await self._tick_or_control(
                websocket,
                activity_name=activity.name,
                seconds=1
            )

    async def handle_end(self, websocket: WebSocket, activity: Activity, total_activities: int):
        """Handle the end of an activity, including closing any processes.
        Args:
            websocket (WebSocket): The WebSocket connection.
            activity (Activity): The activity to execute
            total_activities (int): The total number of activities in the protocol.
        Raises:
            BadRequestException: If the execution request is invalid.
        """
        msg = ProtocolExecMsg(
            activity_name=activity.name,
            activity_num=activity.order,
            message=activity.end_message,
            message_type="end",
            show_timer=activity.show_timer,
            total_activities=total_activities,
            has_time_limit=False,
        )
        await websocket.send_json(msg.model_dump())
        await self._receive_until(
            websocket,
            expected=["next"],
            activity_name=activity.name,
            allow_pause=True
        )

        if activity.close_activity:
            FileManagement().close_process(activity.process_name)
