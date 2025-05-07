import asyncio

from fastapi import WebSocket
from fastapi.background import P

from api.core.file_management.file_management import FileManagement
from api.core.utils.http_exceptions import BadRequestException
from api.modules.organization.errors.protocols import INVALID_EXECUTION_REQUEST
from api.modules.organization.schemas.protocol import Activity, ProtocolExecMsg
from api.modules.organization.services.protocol_service import ProtocolService


class ProtocolExecService:
    def __init__(self):
        self.protocol_service = ProtocolService()

    async def run(self, websocket: WebSocket, protocol_name: str, project_name: str):
        protocol = self.protocol_service.get_protocol(project_name, protocol_name)
        activities = protocol.activities
        for activity in activities:
            await self.run_activity(websocket, activity, len(activities))
        finish_msg = ProtocolExecMsg(message="Protocol finished", message_type="finish")
        await websocket.send_json(finish_msg.model_dump())

    async def run_activity(self, websocket: WebSocket, activity: Activity, total_activities: int):
        await self.handle_start(websocket, activity, total_activities)
        await self.handle_activity_execution(websocket, activity)
        await self.handle_end(websocket, activity)

    async def handle_start(self, websocket: WebSocket, activity: Activity, total_activities: int):
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
            raise BadRequestException(INVALID_EXECUTION_REQUEST.format(activity_name=activity.name))

    async def handle_activity_execution(self, websocket: WebSocket, activity: Activity):
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
                    INVALID_EXECUTION_REQUEST.format(activity_name=activity.name)
                )

    async def send_timer(self, websocket: WebSocket, activity: Activity):
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

    async def handle_end(self, websocket: WebSocket, activity: Activity):
        msg = ProtocolExecMsg(
            activity_name=activity.name,
            activity_num=activity.order,
            message=activity.end_message,
            message_type="end",
            show_timer=activity.show_timer,
            total_activities=0,
            has_time_limit=False,
        )
        await websocket.send_json(msg.model_dump())
        next_res = await websocket.receive_text()
        if next_res != "next":
            raise BadRequestException(INVALID_EXECUTION_REQUEST.format(activity_name=activity.name))

        if activity.close_activity:
            FileManagement().close_process(activity.process_name)
