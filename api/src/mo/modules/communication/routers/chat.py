from fastapi import APIRouter, Depends

from mo.modules.communication.schemas.message import ChatMessage, ChatMessageSend
from mo.modules.communication.services.server_service import ServerService

chat_router = APIRouter(prefix="/communication/chat", tags=["communication"])


def get_server_service() -> ServerService:
    return ServerService()


@chat_router.post(
    "/send",
    status_code=204,
    summary="Send Chat Message",
    description="Broadcast a chat message from the server to all connected remote clients.",
    responses={
        400: {"description": "Server is not online"},
    },
)
async def send_message(
    message: ChatMessageSend,
    service: ServerService = Depends(get_server_service),
) -> None:
    return await service.send_chat_message(message.name, message.content)


@chat_router.get(
    "/history",
    response_model=list[ChatMessage],
    status_code=200,
    summary="Get Chat History",
    description="Return all chat messages exchanged in the current server session.",
)
async def get_history(
    service: ServerService = Depends(get_server_service),
) -> list[ChatMessage]:
    return service.get_chat_history()
