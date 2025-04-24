from datetime import datetime

from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.file_management.paths import RELATIVE_APP_DATA_PATH
from api.core.file_management.validators import FileValidators
from api.core.utils.http_exceptions import (AlreadyExistsException,
                                            BadRequestException)
from api.modules.organization.schemas.participant import (ParticipantPostReq,
                                                          ParticipantPutReq,
                                                          ParticipantRes)
from api.modules.organization.services.paths import (
    PARTICIPANTS_DATA_FILE_NAME, PROJECTS_DATA_FILE_NAME, PROJECTS_DIR_NAME)
from api.modules.organization.services.project_service import ProjectService


class ParticipantService:
    def __init__(self):
        self._data_path = RELATIVE_APP_DATA_PATH
        self._projects_dir_name = PROJECTS_DIR_NAME
        self._projects_storage_name = PROJECTS_DATA_FILE_NAME
        self._participants_storage_name = PARTICIPANTS_DATA_FILE_NAME

        relative_projects_path = f"{self._data_path}/{self._projects_dir_name}"

        self.project_service = ProjectService()
        self.file_management = FileManagement(rel_path=relative_projects_path, make_dirs=False)

    def _get_project_dir_path(self, project_name: str):
        return f"{self._data_path}/{self._projects_dir_name}/{project_name}"

    def _get_participants_storage(self, project_name: str):
        dir_path = self._get_project_dir_path(project_name)
        return JsonStorage(file_name=self._participants_storage_name, rel_path=dir_path)

    def _get_participant_dir_name(self, code: str):
        return f"participant[{code}]"

    def create_participant(
        self, project_name: str, participant: ParticipantPostReq
    ) -> ParticipantRes:
        if self.exists(project_name, participant.code):
            raise AlreadyExistsException(
                f"Participant with code {participant.code} already exists."
            )

        if not FileValidators.is_valid_directory_name(participant.code):
            raise BadRequestException(f"Participant code {participant.code} isn’t allowed.")

        dir_path = self.file_management.create_directory(
            self._get_participant_dir_name(participant.code), rel_path=project_name
        )

        participant_data = {
            "code": participant.code,
            "name": participant.name,
            "notes": participant.notes,
            "location": dir_path,
            "locked": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        participants_storage = self._get_participants_storage(project_name)
        participants_storage.insert_one(participant_data)

        return ParticipantRes(**participant_data)

    def get_all_participants(self, project_name: str) -> list[ParticipantRes]:
        if not self.project_service.exists(project_name):
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")

        participants_storage = self._get_participants_storage(project_name)
        participants = participants_storage.find_all()
        return [ParticipantRes(**participant) for participant in participants]

    def get_participant(self, project_name: str, participant_code: str) -> ParticipantRes:
        if not self.project_service.exists(project_name):
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")

        participants_storage = self._get_participants_storage(project_name)
        participant = participants_storage.find_one({"code": participant_code})
        if not participant:
            raise BadRequestException(
                f"Participant with code {participant_code} doesn’t exist in project {project_name}."
            )

        return ParticipantRes(**participant)

    def update_participant(
        self, project_name: str, participant_code: str, participant: ParticipantPutReq
    ) -> ParticipantRes:
        new_participant = self.get_participant(project_name, participant_code)
        if self.is_participant_locked(project_name, participant_code):
            raise BadRequestException(
                f"Participant with code {participant_code} in project {project_name} is locked."
            )
        
        new_participant.code = participant.code if participant.code else new_participant.code
        new_participant.name = participant.name if participant.name else new_participant.name
        new_participant.notes = (
            participant.notes if (participant.notes is not None) else new_participant.notes
        )
        new_participant.updated_at = datetime.now()

        if participant.code != None and new_participant.code != participant_code:
            if not FileValidators.is_valid_directory_name(participant.code):
                raise BadRequestException(f"Participant code {participant.code} isn’t allowed.")

            if self.exists(project_name, participant.code):
                raise AlreadyExistsException(
                    f"Participant with code {participant.code} already exists."
                )

            old_name = self._get_participant_dir_name(participant_code)
            new_name = self._get_participant_dir_name(participant.code)
            new_location = self.file_management.rename_directory(
                old_name=old_name, new_name=new_name, rel_path=project_name
            )
            new_participant.location = new_location

        participants_storage = self._get_participants_storage(project_name)
        participants_storage.update({"code": participant_code}, new_participant.model_dump())
        return new_participant

    def delete_participant(self, project_name: str, participant_code) -> None:
        if not self.exists(project_name, participant_code):
            raise BadRequestException(
                f"Participant with code {participant_code} doesn’t exist in project {project_name}."
            )
        
        if self.is_participant_locked(project_name, participant_code):
            raise BadRequestException(
                f"Participant with code {participant_code} in project {project_name} is locked."
            )

        dir_name = self._get_participant_dir_name(participant_code)
        self.file_management.delete_directory(dir_name, rel_path=project_name)

        participants_storage = self._get_participants_storage(project_name)
        participants_storage.delete_one({"code": participant_code})

    def lock_participant(self, project_name: str, participant_code: str) -> ParticipantRes:
        participant = self.get_participant(project_name, participant_code)
        if participant is None:
            raise BadRequestException(
                f"Participant with code {participant_code} doesn’t exist in project {project_name}.")

        participant.locked = True
        participants_storage = self._get_participants_storage(project_name)
        participants_storage.update({"code": participant_code}, participant.model_dump())
        return participant
    
    def unlock_participant(self, project_name: str, participant_code: str) -> ParticipantRes:
        participant = self.get_participant(project_name, participant_code)
        if participant is None:
            raise BadRequestException(
                f"Participant with code {participant_code} doesn’t exist in project {project_name}.")

        participant.locked = False
        participants_storage = self._get_participants_storage(project_name)
        participants_storage.update(
            {"code": participant_code}, participant.model_dump())
        return participant

    def is_participant_locked(self, project_name: str, participant_code: str) -> bool:
        participant = self.get_participant(project_name, participant_code)
        if participant is None:
            raise BadRequestException(
                f"Participant with code {participant_code} doesn’t exist in project {project_name}.")

        return participant.locked

    def exists(self, project_name: str, participant_code: str) -> bool:
        if not self.project_service.exists(project_name):
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")

        participants_storage = self._get_participants_storage(project_name)
        return participants_storage.exists({"code": participant_code})
