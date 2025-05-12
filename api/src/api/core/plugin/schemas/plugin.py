
from pydantic import BaseModel


class PluginRes(BaseModel):
    name: str
    version: str
    description: str
    repository: str
    author: str = ""
    author_email: str = ""
    platforms: list[str]
    module: str
    location: str
