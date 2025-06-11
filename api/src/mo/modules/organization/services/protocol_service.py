from datetime import datetime

from mo.core.config.constants import RELATIVE_APP_DATA_PATH
from mo.core.file_management.file_management import FileManagement
from mo.core.file_management.json_storage import JsonStorage
from mo.core.utils.http_exceptions import (
    AlreadyExistsException,
    BadRequestException,
    NotFoundException,
)
from mo.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from mo.modules.organization.errors.protocols import (
    ACTIVITY_INVALID_FILE_PATH,
    ACTIVITY_INVALID_TIME_LIMIT,
    ACTIVITY_PROCESS_NAME_REQUIRED,
    PROTOCOL_ALREADY_EXISTS,
    PROTOCOL_DOES_NOT_EXIST,
    PROTOCOL_IS_LOCKED,
)
from mo.modules.organization.schemas.protocol import (
    Activity,
    ActivityPostReq,
    ActivityPutReq,
    ProtocolPostReq,
    ProtocolPutReq,
    ProtocolRes,
)
from mo.modules.organization.services.paths import (
    PROJECTS_DATA_FILE_NAME,
    PROJECTS_DIR_NAME,
    PROTOCOLS_DATA_FILE_NAME,
)
from mo.modules.organization.services.project_service import ProjectService


class ProtocolService:
    """Service for managing protocols in projects,
    including creating, updating, deleting, and locking protocols.

    Protocols are stored in JSON files within the project's directory.
    """

    def __init__(self):
        """Initialize the ProtocolService, setting up paths and services."""
        self._data_path = RELATIVE_APP_DATA_PATH
        self._projects_dir_name = PROJECTS_DIR_NAME
        self._projects_storage_name = PROJECTS_DATA_FILE_NAME
        self._protocols_storage_name = PROTOCOLS_DATA_FILE_NAME

        relative_projects_path = f"{self._data_path}/{self._projects_dir_name}"
        self.project_service = ProjectService()
        self.file_management = FileManagement(rel_path=relative_projects_path, make_dirs=False)

    def _get_protocols_storage(self, project_name: str):
        """Get the storage for protocols of a specific project.
        Args:
            project_name (str): The name of the project.
        """
        project_path = self.project_service.get_project_dir_path(project_name)
        return JsonStorage(file_name=self._protocols_storage_name, rel_path=project_path)

    def create_protocol(self, project_name: str, protocol: ProtocolPostReq) -> ProtocolRes:
        """Create a new protocol within a project.
        Args:
            project_name (str): The name of the project.
            protocol (ProtocolPostReq): The protocol data to create.
        Returns:
            ProtocolRes: The created protocol.
        Raises:
            NotFoundException: If the project does not exist.
            AlreadyExistsException: If a protocol with the same name already exists.
            BadRequestException: If the protocol data is invalid.
        """
        protocol.name = protocol.name.strip()
        if self.exists(project_name, protocol.name):
            raise AlreadyExistsException(
                PROTOCOL_ALREADY_EXISTS.format(
                    protocol_name=protocol.name, project_name=project_name
                )
            )

        activities_data = self._validate_and_format_activities(protocol.activities, protocol.name)

        protocol_data = {
            "name": protocol.name,
            "activities": activities_data,
            "locked": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        protocols_storage = self._get_protocols_storage(project_name)
        protocols_storage.insert_one(protocol_data)
        return ProtocolRes(**protocol_data)

    def get_all_protocols(self, project_name: str) -> list[ProtocolRes]:
        """Retrieves all protocols from a project.
        Args:
            project_name (str): Name of the project.
        Returns:
            list[ProtocolRes]: List of all protocols for the project.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        protocols_storage = self._get_protocols_storage(project_name)
        protocols = protocols_storage.find_all()
        return [ProtocolRes(**protocol) for protocol in protocols]

    def get_protocol(self, project_name: str, protocol_name: str) -> ProtocolRes:
        """Retrieves a specific protocol from a project.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol.
        Returns:
            ProtocolRes: The requested protocol.
        Raises:
            NotFoundException: If the project or protocol does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        protocols_storage = self._get_protocols_storage(project_name)
        protocol = protocols_storage.find_one({"name": protocol_name})
        if not protocol:
            raise NotFoundException(
                PROTOCOL_DOES_NOT_EXIST.format(
                    protocol_name=protocol_name, project_name=project_name
                )
            )
        return ProtocolRes(**protocol)

    def update_protocol(
        self, project_name: str, protocol_name: str, protocol: ProtocolPutReq
    ) -> ProtocolRes:
        """Update an existing protocol in a project.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol to update.
            protocol (ProtocolPutReq): The updated protocol data.
        Returns:
            ProtocolRes: The updated protocol.
        Raises:
            NotFoundException: If the project or protocol does not exist.
            AlreadyExistsException: If a protocol with the new name already exists.
            BadRequestException: If the protocol data is invalid.
        """
        existing_protocol = self.get_protocol(project_name, protocol_name)
        if self.is_protocol_locked(project_name, protocol_name):
            raise BadRequestException(
                PROTOCOL_IS_LOCKED.format(protocol_name=protocol_name, project_name=project_name)
            )

        new_name = protocol.name.strip() if protocol.name else existing_protocol.name

        if new_name != protocol_name and self.exists(project_name, new_name):
            raise AlreadyExistsException(
                PROTOCOL_ALREADY_EXISTS.format(protocol_name=new_name, project_name=project_name)
            )

        updated_activities = (
            self._validate_and_format_activities(protocol.activities, new_name)
            if protocol.activities
            else existing_protocol.activities
        )

        updated_protocol = ProtocolRes(
            name=new_name,
            activities=updated_activities,
            locked=existing_protocol.locked,
            created_at=existing_protocol.created_at,
            updated_at=datetime.now(),
        )

        self._get_protocols_storage(project_name).update(
            {"name": protocol_name}, updated_protocol.model_dump()
        )
        return updated_protocol

    def delete_protocol(self, project_name: str, protocol_name: str) -> None:
        """Delete a protocol from a project.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol to delete.
        Raises:
            NotFoundException: If the project or protocol does not exist.
            BadRequestException: If the protocol is locked.
        """
        if not self.exists(project_name, protocol_name):
            raise NotFoundException(
                PROTOCOL_DOES_NOT_EXIST.format(
                    protocol_name=protocol_name, project_name=project_name
                )
            )

        if self.is_protocol_locked(project_name, protocol_name):
            raise BadRequestException(
                PROTOCOL_IS_LOCKED.format(protocol_name=protocol_name, project_name=project_name)
            )

        protocols_storage = self._get_protocols_storage(project_name)
        protocols_storage.delete_one({"name": protocol_name})

    def lock_protocol(self, project_name: str, protocol_name: str) -> ProtocolRes:
        """Lock a protocol to prevent further modifications.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol to lock.
        Returns:
            ProtocolRes: The locked protocol.
        Raises:
            NotFoundException: If the project or protocol does not exist.
        """
        return self._set_protocol_lock(project_name, protocol_name, True)

    def unlock_protocol(self, project_name: str, protocol_name: str) -> ProtocolRes:
        """Unlock a protocol to allow modifications.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol to unlock.
        Returns:
            ProtocolRes: The unlocked protocol.
        Raises:
            NotFoundException: If the project or protocol does not exist.
        """
        return self._set_protocol_lock(project_name, protocol_name, False)

    def _set_protocol_lock(
        self, project_name: str, protocol_name: str, locked: bool
    ) -> ProtocolRes:
        """Set the lock status of a protocol.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol.
            locked (bool): Lock status to set.
        Returns:
            ProtocolRes: The protocol with updated lock status.
        Raises:
            NotFoundException: If the project or protocol does not exist.
            BadRequestException: If the protocol is already in the desired lock state.
        """
        protocol = self.get_protocol(project_name, protocol_name)
        protocol.locked = locked
        storage = self._get_protocols_storage(project_name)
        storage.update({"name": protocol_name}, protocol.model_dump())
        return protocol

    def is_protocol_locked(self, project_name: str, protocol_name: str) -> bool:
        """Check if a protocol is locked.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol.
        Returns:
            bool: True if the protocol is locked, False otherwise.
        Raises:
            NotFoundException: If the project or protocol does not exist.
        """
        protocol = self.get_protocol(project_name, protocol_name)
        if protocol is None:
            raise NotFoundException(
                PROTOCOL_DOES_NOT_EXIST.format(
                    protocol_name=protocol_name, project_name=project_name
                )
            )
        return protocol.locked

    def exists(self, project_name: str, protocol_name: str) -> bool:
        """Check if a protocol exists within a project.
        Args:
            project_name (str): Name of the project.
            protocol_name (str): Name of the protocol.
        Returns:
            bool: True if the protocol exists, False otherwise.
        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        protocols_storage = self._get_protocols_storage(project_name)
        return protocols_storage.exists({"name": protocol_name})

    def _validate_and_format_activities(
        self, activities: list[ActivityPostReq] | list[ActivityPutReq], protocol_name: str
    ) -> list[Activity]:
        """Validate and format activities for a protocol.
        Args:
            activities (list[ActivityPostReq] | list[ActivityPutReq]): List of activities to validate and format.
            protocol_name (str): Name of the protocol for error messages.
        Returns:
            list[Activity]: List of formatted activities.
        Raises:
            BadRequestException: If any activity has invalid data.
        """
        formatted = []
        for idx, activity in enumerate(activities):
            activity.name = activity.name.strip()
            if activity.path and not FileManagement.is_file(activity.path):
                raise BadRequestException(
                    ACTIVITY_INVALID_FILE_PATH.format(
                        activity_name=activity.name, protocol_name=protocol_name
                    )
                )

            if activity.has_time_limit and activity.time_limit <= 0:
                raise BadRequestException(
                    ACTIVITY_INVALID_TIME_LIMIT.format(
                        activity_name=activity.name, protocol_name=protocol_name
                    )
                )

            if activity.close_activity and not activity.process_name:
                raise BadRequestException(
                    ACTIVITY_PROCESS_NAME_REQUIRED.format(
                        activity_name=activity.name, protocol_name=protocol_name
                    )
                )

            formatted.append(
                {
                    "order": idx + 1,
                    "name": activity.name,
                    "path": activity.path,
                    "has_time_limit": activity.has_time_limit,
                    "time_limit": activity.time_limit if activity.has_time_limit else 0,
                    "start_message": activity.start_message,
                    "end_message": activity.end_message,
                    "close_activity": activity.close_activity,
                    "process_name": activity.process_name,
                    "show_timer": activity.show_timer,
                }
            )
        return formatted
