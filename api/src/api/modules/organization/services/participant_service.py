from datetime import datetime

from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.file_management.paths import RELATIVE_APP_DATA_PATH
from api.core.file_management.validators import FileValidators
from api.core.utils.http_exceptions import (AlreadyExistsException,
                                            BadRequestException,
                                            NotFoundException)
from api.modules.organization.errors.participant import (
    PARTICIPANT_ALREADY_EXISTS, PARTICIPANT_CODE_NOT_ALLOWED,
    PARTICIPANT_DOES_NOT_EXIST, PARTICIPANT_IS_LOCKED)
from api.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from api.modules.organization.schemas.participant import (ParticipantPostReq,
                                                          ParticipantPutReq,
                                                          ParticipantRes)
from api.modules.organization.services.paths import (
    PARTICIPANTS_DATA_FILE_NAME, PROJECTS_DATA_FILE_NAME, PROJECTS_DIR_NAME)
from api.modules.organization.services.project_service import ProjectService


class ParticipantService:
    """Service class for managing participants within projects,
    including creation, updating, deletion, locking, and unlocking of participants.

    Participants are stored as directories and their metadata is managed in JSON storage files inside each project.
    """

    def __init__(self):
        """Initializes the ParticipantService, setting up paths and services for projects and participants."""
        self._data_path = RELATIVE_APP_DATA_PATH
        self._projects_dir_name = PROJECTS_DIR_NAME
        self._projects_storage_name = PROJECTS_DATA_FILE_NAME
        self._participants_storage_name = PARTICIPANTS_DATA_FILE_NAME

        relative_projects_path = f"{self._data_path}/{self._projects_dir_name}"

        self.project_service = ProjectService()
        self.file_management = FileManagement(rel_path=relative_projects_path, make_dirs=False)

    def _get_participants_storage(self, project_name: str):
        """Retrieves the JSON storage handler for participants of a specific project.

        Args:
            project_name (str): Name of the project.

        Returns:
            JsonStorage: JSON storage instance for managing participants.
        """
        dir_path = self.project_service.get_project_dir_path(project_name)
        return JsonStorage(file_name=self._participants_storage_name, rel_path=dir_path)

    def _get_participant_dir_name(self, code: str):
        """Generates the directory name for a participant based on their code.

        Args:
            code (str): Participant's unique code.

        Returns:
            str: Directory name for the participant.
        """
        return f"participant[{code}]"

    def create_participant(
        self, project_name: str, participant: ParticipantPostReq
    ) -> ParticipantRes:
        """Creates a new participant within a project.

        Args:
            project_name (str): Name of the project.
            participant (ParticipantPostReq): Participant data to create.

        Returns:
            ParticipantRes: The created participant details.

        Raises:
            AlreadyExistsException: If a participant with the same code already exists.
            BadRequestException: If the participant code is invalid.
        """
        if self.exists(project_name, participant.code):
            raise AlreadyExistsException(
                PARTICIPANT_ALREADY_EXISTS.format(code=participant.code, project_name=project_name)
            )

        if not FileValidators.is_valid_directory_name(participant.code):
            raise BadRequestException(PARTICIPANT_CODE_NOT_ALLOWED.format(code=participant.code))

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
        """Retrieves all participants from a project.

        Args:
            project_name (str): Name of the project.

        Returns:
            list[ParticipantRes]: List of all participants.

        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))

        participants_storage = self._get_participants_storage(project_name)
        participants = participants_storage.find_all()
        return [ParticipantRes(**participant) for participant in participants]

    def get_participant(self, project_name: str, participant_code: str) -> ParticipantRes:
        """Retrieves a participant by their code from a project.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant.

        Returns:
            ParticipantRes: The participant details.

        Raises:
            NotFoundException: If the project or participant does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))

        participants_storage = self._get_participants_storage(project_name)
        participant = participants_storage.find_one({"code": participant_code})
        if not participant:
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(code=participant_code, project_name=project_name)
            )

        return ParticipantRes(**participant)

    def update_participant(
        self, project_name: str, participant_code: str, participant: ParticipantPutReq
    ) -> ParticipantRes:
        """Updates a participant's information.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Current code of the participant.
            participant (ParticipantPutReq): New participant data.

        Returns:
            ParticipantRes: Updated participant details.

        Raises:
            BadRequestException: If the participant is locked or the new code is invalid.
            AlreadyExistsException: If a participant with the new code already exists.
        """
        new_participant = self.get_participant(project_name, participant_code)
        if self.is_participant_locked(project_name, participant_code):
            raise BadRequestException(
                PARTICIPANT_IS_LOCKED.format(code=participant_code, project_name=project_name)
            )

        new_participant.code = participant.code if participant.code else new_participant.code
        new_participant.name = participant.name if participant.name else new_participant.name
        new_participant.notes = (
            participant.notes if (participant.notes is not None) else new_participant.notes
        )
        new_participant.updated_at = datetime.now()

        if participant.code != None and new_participant.code != participant_code:
            if not FileValidators.is_valid_directory_name(participant.code):
                raise BadRequestException(
                    PARTICIPANT_CODE_NOT_ALLOWED.format(code=participant.code)
                )

            if self.exists(project_name, participant.code):
                raise AlreadyExistsException(
                    PARTICIPANT_ALREADY_EXISTS.format(
                        code=participant.code, project_name=project_name
                    )
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
        """Deletes a participant from a project.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant to delete.

        Raises:
            NotFoundException: If the participant does not exist.
            BadRequestException: If the participant is locked.
        """
        if not self.exists(project_name, participant_code):
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(code=participant_code, project_name=project_name)
            )

        if self.is_participant_locked(project_name, participant_code):
            raise BadRequestException(
                PARTICIPANT_IS_LOCKED.format(code=participant_code, project_name=project_name)
            )

        dir_name = self._get_participant_dir_name(participant_code)
        self.file_management.delete_directory(dir_name, rel_path=project_name)

        participants_storage = self._get_participants_storage(project_name)
        participants_storage.delete_one({"code": participant_code})

    def lock_participant(self, project_name: str, participant_code: str) -> ParticipantRes:
        """Locks a participant, preventing modifications.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant.

        Returns:
            ParticipantRes: The locked participant details.

        Raises:
            NotFoundException: If the participant does not exist.
        """
        participant = self.get_participant(project_name, participant_code)
        if participant is None:
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(code=participant_code, project_name=project_name)
            )

        participant.locked = True
        participants_storage = self._get_participants_storage(project_name)
        participants_storage.update({"code": participant_code}, participant.model_dump())
        return participant

    def unlock_participant(self, project_name: str, participant_code: str) -> ParticipantRes:
        """Unlocks a participant, allowing modifications.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant.

        Returns:
            ParticipantRes: The unlocked participant details.

        Raises:
            NotFoundException: If the participant does not exist.
        """
        participant = self.get_participant(project_name, participant_code)
        if participant is None:
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(code=participant_code, project_name=project_name)
            )

        participant.locked = False
        participants_storage = self._get_participants_storage(project_name)
        participants_storage.update({"code": participant_code}, participant.model_dump())
        return participant

    def is_participant_locked(self, project_name: str, participant_code: str) -> bool:
        """Checks if a participant is locked.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant.

        Returns:
            bool: True if the participant is locked, False otherwise.

        Raises:
            NotFoundException: If the participant does not exist.
        """
        participant = self.get_participant(project_name, participant_code)
        if participant is None:
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(code=participant_code, project_name=project_name)
            )

        return participant.locked

    def exists(self, project_name: str, participant_code: str) -> bool:
        """Checks if a participant exists within a project.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant.

        Returns:
            bool: True if the participant exists, False otherwise.

        Raises:
            NotFoundException: If the project does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))

        participants_storage = self._get_participants_storage(project_name)
        return participants_storage.exists({"code": participant_code})
