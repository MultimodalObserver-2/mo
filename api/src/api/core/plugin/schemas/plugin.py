
from pydantic import BaseModel


class PluginRes(BaseModel):
    name: str
    version: str
    description: str
    repo: str
    author: str
    author_email: str
    platform: str
    module: str
    location: str
