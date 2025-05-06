import asyncio
from api.core.file_management.file_management import FileManagement
from api.modules.organization.schemas.protocol import Activity, ProtocolExecMsg
from api.modules.organization.services.protocol_service import ProtocolService
from fastapi import WebSocket
from fastapi.background import P


class ProtocolExecService:
    def __init__(self):
        self.protocol_service = ProtocolService()

    async def run(self, websocket: WebSocket, protocol_name: str, project_name: str):
        protocol = self.protocol_service.get_protocol(
            project_name, protocol_name)
        activities = protocol.activities
        for activity in activities:
            await self.run_activity(websocket, activity, len(activities))
        finish_msg = ProtocolExecMsg(
            message="Protocol finished",
            message_type="finish"
        )
        await websocket.send_json(finish_msg.model_dump())

    async def run_activity(self, websocket: WebSocket, activity: Activity, total_activities: int):
        msg = ProtocolExecMsg(activity_name=activity.name, activity_num=activity.order,
                              message=activity.start_message, message_type="start", show_timer=activity.show_timer,
                              total_activities=total_activities, has_time_limit=activity.has_time_limit)
        await websocket.send_json(msg.model_dump())
        start_res = await websocket.receive_text()
        if start_res != "start":
            raise Exception("Invalid start response")

        if activity.path:
            FileManagement().open_file(activity.path)

        if activity.has_time_limit:
            if activity.show_timer:
                for remaining in range(activity.time_limit, -1, -1):
                    msg.message = str(remaining)
                    msg.message_type = "timer"
                    await websocket.send_json(msg.model_dump())
                    await asyncio.sleep(1)
            else:
                await asyncio.sleep(activity.time_limit)
        else:
            completed_res = await websocket.receive_text()
            if completed_res != "completed":
                raise Exception("Invalid completed response")

        msg.message = activity.end_message
        msg.message_type = "end"
        await websocket.send_json(msg.model_dump())
        next_res = await websocket.receive_text()
        if next_res != "next":
            raise Exception("Invalid next response")

        if activity.close_activity:
            FileManagement().close_process(activity.process_name)
