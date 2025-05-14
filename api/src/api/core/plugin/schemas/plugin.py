from api.core.plugin.sys_platform import SysPlatform
from pydantic import BaseModel

class PlatformsRes(BaseModel):
    linux: bool = False
    windows: bool = False
    mac: bool = False


class PluginRes(BaseModel):
    name: str
    version: str
    description: str
    repository: str
    icon_path: str = ""
    author: str = ""
    author_email: str = ""
    platforms: PlatformsRes
    module: str
    location: str
