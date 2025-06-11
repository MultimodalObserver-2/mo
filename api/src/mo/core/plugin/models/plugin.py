from abc import ABC, abstractmethod
from typing import Optional

from pydantic import BaseModel, PrivateAttr

from mo.core.plugin.models.semantic_version import SemanticVersion
from mo.core.plugin.models.settings import Settings
from mo.core.plugin.models.sys_platform import SysPlatform


class PluginAuthor(BaseModel):
    """Represents the author of a plugin."""
    name: Optional[str] = None  # Name of the author
    email: Optional[str] = None  # Email of the author


class PluginIcons(BaseModel):
    """Represents icons for a plugin."""
    dark: Optional[str] = None  # Path to the dark mode icon
    light: Optional[str] = None  # Path to the light mode icon


class PluginPublisher(BaseModel):
    """Represents the publisher of a plugin."""
    id: str  # Unique identifier for the publisher
    name: str  # Name of the publisher
    url: Optional[str] = None  # URL to the publisher's website


class PluginMetadata(BaseModel):
    """Metadata for a plugin."""
    plugin_id: str  # Unique identifier for the plugin
    name: str  # Name of the plugin
    description: str  # Description of the plugin
    version: SemanticVersion  # Version of the plugin
    publisher: PluginPublisher  # Publisher of the plugin
    repository: str  # URL to the plugin's repository
    # Path to the plugin's icon or icons
    icon_path: Optional[str] | Optional[PluginIcons] = None
    author: Optional[PluginAuthor] = None  # Author of the plugin
    platform: SysPlatform  # Supported platform for the plugin
    _location: Optional[str] = PrivateAttr(
        default=None)  # Location of the plugin files
    _module: Optional[str] = PrivateAttr(
        default=None)  # Module name of the plugin
    # Indicates if the plugin is loaded
    _is_loaded: bool = PrivateAttr(default=False)
    # Error message if the plugin failed to load
    _error: Optional[str] = PrivateAttr(default=None)

    def get_final_id(self) -> str:
        """Generates a final ID for the plugin in the format 'publisher_id.plugin_id'."""
        return f"{self.publisher.id}.{self.plugin_id}"

    def from_final_id(self, final_id: str) -> None:
        """Sets the plugin ID and publisher ID from a final ID string."""
        parts = final_id.split(".")
        if len(parts) != 2:
            raise ValueError(
                "Invalid final ID format. Expected 'publisher_id.plugin_id'.")
        self.publisher.id = parts[0]
        self.plugin_id = parts[1]

    def is_plugin(self, plugin_id: str, publisher_id) -> bool:
        """Checks if the plugin matches the given plugin ID and publisher ID."""
        return self.plugin_id == plugin_id and self.publisher.id == publisher_id

    def is_plugin_from_final_id(self, final_id: str) -> bool:
        """Checks if the plugin matches the given final ID."""
        return self.get_final_id() == final_id


class Plugin(ABC):
    """Base class for plugins in the system.
    This class defines the basic structure and methods that all plugins must implement.
    """
    metadata: PluginMetadata # Metadata for the plugin
    settings: Settings = Settings() # Settings for the plugin
    _module_name: str = "core" # Module name for the plugin

    @abstractmethod
    def load(self):
        """Load the plugin.
        This method should be implemented to initialize the plugin and prepare it for use.
        It may include loading resources, setting up configurations, etc.
        """
        pass

    @abstractmethod
    def unload(self):
        """Unload the plugin.
        This method should be implemented to clean up resources and configurations used by the plugin.
        It be called when the plugin is no longer needed or when the application is shutting down.
        """
        pass

    def configure(self, settings: Settings):
        """Configure the plugin with the provided settings.
        Args:
            settings (Settings): The settings to configure the plugin with.
        """
        self.settings = settings
        self.on_configure(settings)

    def on_configure(self, settings: Settings) -> None:
        """Override this method to handle configuration changes.
        Args:
            settings (Settings): The updated settings for the plugin.
        """
        pass
