from datetime import datetime
from typing import Any

from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.file_management.paths import RELATIVE_APP_DATA_PATH
from api.core.utils.http_exceptions import (AlreadyExistsException,
                                            BadRequestException,
                                            NotFoundException)
from api.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from api.modules.organization.errors.protocols import (ACTIVITY_INVALID_FILE_PATH, ACTIVITY_INVALID_TIME_LIMIT, ACTIVITY_PROCESS_NAME_REQUIRED, PROTOCOL_ALREADY_EXISTS,
                                                       PROTOCOL_DOES_NOT_EXIST, PROTOCOL_IS_LOCKED)
from api.modules.organization.schemas.protocol import (ProtocolPostReq,
                                                       ProtocolPutReq,
                                                       ProtocolRes)
from api.modules.organization.services.paths import (PROJECTS_DATA_FILE_NAME,
                                                     PROJECTS_DIR_NAME,
                                                     PROTOCOLS_DATA_FILE_NAME)
from api.modules.organization.services.project_service import ProjectService


class ProtocolService:
    def __init__(self):
        self._data_path = RELATIVE_APP_DATA_PATH
        self._projects_dir_name = PROJECTS_DIR_NAME
        self._projects_storage_name = PROJECTS_DATA_FILE_NAME
        self._protocols_storage_name = PROTOCOLS_DATA_FILE_NAME

        relative_projects_path = f"{self._data_path}/{self._projects_dir_name}"
        self.project_service = ProjectService()
        self.file_management = FileManagement(rel_path=relative_projects_path, make_dirs=False)

    def _get_protocols_storage(self, project_name: str):
        project_path = self.project_service.get_project_dir_path(project_name)
        return JsonStorage(file_name=self._protocols_storage_name, rel_path=project_path)

    def create_protocol(self, project_name: str, protocol: ProtocolPostReq) -> ProtocolRes:
        protocol.name = protocol.name.strip()
        if self.exists(project_name, protocol.name):
            raise AlreadyExistsException(
                PROTOCOL_ALREADY_EXISTS.format(
                    protocol_name=protocol.name, project_name=project_name
                )
            )

        activities_data = []
        for idx, activity in enumerate(protocol.activities):
            activity.name = activity.name.strip()
            if activity.path and not FileManagement.is_file(activity.path):
                raise BadRequestException(ACTIVITY_INVALID_FILE_PATH.format(
                    activity_name=activity.name,
                    protocol_name=protocol.name,
                ))

            if activity.has_time_limit and activity.time_limit <= 0:
                raise BadRequestException(ACTIVITY_INVALID_TIME_LIMIT.format(
                    activity_name=activity.name,
                    protocol_name=protocol.name))
            if activity.close_activity and not activity.process_name:
                raise BadRequestException(ACTIVITY_PROCESS_NAME_REQUIRED.format(
                    activity_name=activity.name,
                    protocol_name=protocol.name,
                ))

            activity_data = {
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
            activities_data.append(activity_data)

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
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        protocols_storage = self._get_protocols_storage(project_name)
        protocols = protocols_storage.find_all()
        return [ProtocolRes(**protocol) for protocol in protocols]

    def get_protocol(self, project_name: str, protocol_name: str) -> ProtocolRes:
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
        new_protocol = self.get_protocol(project_name, protocol_name)
        if self.is_protocol_locked(project_name, protocol_name):
            raise BadRequestException(
                PROTOCOL_IS_LOCKED.format(protocol_name=protocol_name))

        protocol.name = protocol.name.strip() if protocol.name else new_protocol.name
        new_protocol.name = protocol.name if protocol.name else new_protocol.name
        
        if protocol.activities:
            new_activities = []
            for idx, activity in enumerate(protocol.activities):
                activity.name = activity.name.strip()
                if activity.path and not FileManagement.is_file(activity.path):
                    raise BadRequestException(ACTIVITY_INVALID_FILE_PATH.format(
                        activity_name=activity.name,
                        protocol_name=new_protocol.name,
                    ))

                if activity.has_time_limit and activity.time_limit <= 0:
                    raise BadRequestException(ACTIVITY_INVALID_TIME_LIMIT.format(
                        activity_name=activity.name,
                        protocol_name=new_protocol.name))

                if activity.close_activity and not activity.process_name:
                    raise BadRequestException(ACTIVITY_PROCESS_NAME_REQUIRED.format(
                        activity_name=activity.name,
                        protocol_name=protocol.name,
                    ))
                activity_data = {
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
                new_activities.append(activity_data)
            new_protocol.activities = new_activities

        new_protocol.updated_at = datetime.now()
        if (
            protocol.name != None
            and new_protocol.name != protocol_name
            and self.exists(project_name, new_protocol.name)
        ):
            raise AlreadyExistsException(
                PROTOCOL_ALREADY_EXISTS.format(
                    protocol_name=new_protocol.name, project_name=project_name
                )
            )

        protocol_storage = self._get_protocols_storage(project_name)
        protocol_storage.update({"name": protocol_name}, new_protocol.model_dump())
        return new_protocol

    def delete_protocol(self, project_name: str, protocol_name: str) -> None:
        if not self.exists(project_name, protocol_name):
            raise NotFoundException(
                PROTOCOL_DOES_NOT_EXIST.format(
                    protocol_name=protocol_name, project_name=project_name
                )
            )
        
        if self.is_protocol_locked(project_name, protocol_name):
            raise BadRequestException(PROTOCOL_IS_LOCKED.format(protocol_name=protocol_name))
        
        protocols_storage = self._get_protocols_storage(project_name)
        protocols_storage.delete_one({"name": protocol_name})
    
    def lock_protocol(self, project_name: str, protocol_name: str) -> ProtocolRes:
        protocol = self.get_protocol(project_name, protocol_name)
        if protocol is None:
            raise NotFoundException(
                PROTOCOL_DOES_NOT_EXIST.format(
                    protocol_name=protocol_name, project_name=project_name
                )
            )
        protocol.locked = True
        protocol_storage = self._get_protocols_storage(project_name)
        protocol_storage.update({"name": protocol_name}, protocol.model_dump())
        return protocol

    def unlock_protocol(self, project_name: str, protocol_name: str) -> ProtocolRes:
        protocol = self.get_protocol(project_name, protocol_name)
        if protocol is None:
            raise NotFoundException(
                PROTOCOL_DOES_NOT_EXIST.format(
                    protocol_name=protocol_name, project_name=project_name
                )
            )
        protocol.locked = False
        protocol_storage = self._get_protocols_storage(project_name)
        protocol_storage.update({"name": protocol_name}, protocol.model_dump())
        return protocol
    
    def is_protocol_locked(self, project_name: str, protocol_name: str) -> bool:
        protocol = self.get_protocol(project_name, protocol_name)
        if protocol is None:
            raise NotFoundException(
                PROTOCOL_DOES_NOT_EXIST.format(
                    protocol_name=protocol_name, project_name=project_name
                )
            )
        return protocol.locked

    def exists(self, project_name: str, protocol_name: str) -> bool:
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        protocols_storage = self._get_protocols_storage(project_name)
        return protocols_storage.exists({"name": protocol_name})
