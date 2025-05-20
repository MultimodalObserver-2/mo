from api.core.plugin.plugin import PluginMetadata
from api.core.plugin.plugin_management import PluginManagement
from api.modules.capture.plugins.capture_plugin import CapturePlugin
from api.modules.organization.services.project_service import ProjectService


class CaptureService:
    def __init__(self):
        self.project_service = ProjectService()
        self.plugin_management = PluginManagement()

    def get_capture_plugins(self) -> list[PluginMetadata]:
        plugins = self.plugin_management.get_plugins_from_type(CapturePlugin)
        plugins_metadata = [plugin.metadata for plugin in plugins]
        return plugins_metadata
