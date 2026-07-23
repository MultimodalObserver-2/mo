from pydantic import BaseModel


class ChatMessageSend(BaseModel):
    name: str
    content: str


class ChatMessage(BaseModel):
    timestamp: float
    name: str
    content: str
    from_server: bool = True


class NoteMessage(BaseModel):
    timestamp: float
    name: str
    content: str
    time_begin: float
    time_end: float
