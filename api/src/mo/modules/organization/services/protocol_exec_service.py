import asyncio

from fastapi import WebSocket

from mo.core.file_management.file_management import FileManagement
from mo.core.utils.http_exceptions import BadRequestException
from mo.modules.organization.errors.protocols import INVALID_EXECUTION_REQUEST
from mo.modules.organization.schemas.protocol import Activity, ProtocolExecMsg
from mo.modules.organization.services.protocol_service import ProtocolService


class ProtocolExecService:
    """Service to handle protocol execution logic."""

    def __init__(self):
        """Initialize the ProtocolExecService."""
        self.protocol_service = ProtocolService()

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
        start_res = await websocket.receive_text()
        if start_res != "start":
            raise BadRequestException(INVALID_EXECUTION_REQUEST(activity_name=activity.name))

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
            await asyncio.sleep(activity.time_limit)
        else:
            completed_res = await websocket.receive_text()
            if completed_res != "completed":
                raise BadRequestException(
                    INVALID_EXECUTION_REQUEST(activity_name=activity.name)
                )

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
            await asyncio.sleep(1)

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
        next_res = await websocket.receive_text()
        if next_res != "next":
            raise BadRequestException(INVALID_EXECUTION_REQUEST(activity_name=activity.name))

        if activity.close_activity:
            FileManagement().close_process(activity.process_name)
