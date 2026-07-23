from fastapi import FastAPI

from mo.modules.communication.routers.chat import chat_router
from mo.modules.communication.routers.notes import notes_router
from mo.modules.communication.routers.server import server_router


def register(app: FastAPI) -> None:
    app.include_router(server_router)
    app.include_router(chat_router)
    app.include_router(notes_router)
