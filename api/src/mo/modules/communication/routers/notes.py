from fastapi import APIRouter, Depends

from mo.modules.communication.schemas.message import NoteMessage
from mo.modules.communication.services.server_service import ServerService

notes_router = APIRouter(prefix="/communication/notes", tags=["communication"])


def get_server_service() -> ServerService:
    return ServerService()


@notes_router.get(
    "/history",
    response_model=list[NoteMessage],
    status_code=200,
    summary="Get Notes History",
    description="Return all remote notes received during the current server session.",
)
async def get_history(
    service: ServerService = Depends(get_server_service),
) -> list[NoteMessage]:
    return service.get_notes_history()
