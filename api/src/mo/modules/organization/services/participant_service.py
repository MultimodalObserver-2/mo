import os
from datetime import datetime

from mo.core.config.constants import RELATIVE_APP_DATA_PATH
from mo.core.file_management.file_management import FileManagement
from mo.core.file_management.json_storage import JsonStorage
from mo.core.file_management.validators import FileValidators
from mo.core.utils.http_exceptions import (
    AlreadyExistsException,
    BadRequestException,
    NotFoundException,
)
from mo.modules.organization.errors.participant import (
    PARTICIPANT_ALREADY_EXISTS,
    PARTICIPANT_CODE_NOT_ALLOWED,
    PARTICIPANT_DOES_NOT_EXIST,
    PARTICIPANT_IS_LOCKED,
)
from mo.modules.organization.errors.project import PROJECT_DOES_NOT_EXIST
from mo.modules.organization.schemas.participant import (
    ParticipantData,
    ParticipantPostReq,
    ParticipantPutReq,
    ParticipantRes,
)
from mo.modules.organization.services.paths import (
    PARTICIPANTS_DATA_FILE_NAME,
    PROJECTS_DATA_FILE_NAME,
    PROJECTS_DIR_NAME,
    RELATIVE_PROJECTS_PATH,
)
from mo.modules.organization.services.project_service import ProjectService


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

        self.project_service = ProjectService()
        self.file_management = FileManagement(rel_path=RELATIVE_PROJECTS_PATH, make_dirs=False)

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
        participant.code = participant.code.strip()
        if self.exists(project_name, participant.code):
            raise AlreadyExistsException(
                PARTICIPANT_ALREADY_EXISTS.format(code=participant.code, project_name=project_name)
            )

        if not FileValidators.is_valid_directory_name(participant.code):
            raise BadRequestException(PARTICIPANT_CODE_NOT_ALLOWED.format(code=participant.code))

        dir_name = self._get_participant_dir_name(participant.code)
        self.file_management.create_directory(dir_name, rel_path=project_name)

        participant_data = ParticipantData(
            code=participant.code,
            name=participant.name.strip(),
            notes=participant.notes or [],
            rel_location=dir_name,
            locked=False,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        participants_storage = self._get_participants_storage(project_name)
        participants_storage.insert_one(participant_data.model_dump())
        project_rel_location = self.project_service.get_rel_project_location(project_name)
        return ParticipantRes.from_data(participant_data, project_rel_location=project_rel_location)

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
        project_rel_location = self.project_service.get_rel_project_location(project_name)
        return [
            ParticipantRes.from_data(ParticipantData(**participant), project_rel_location)
            for participant in participants
        ]

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
        project_rel_location = self.project_service.get_rel_project_location(project_name)
        return ParticipantRes.from_data(ParticipantData(**participant), project_rel_location)

    def get_participant_data(self, project_name: str, participant_code: str) -> ParticipantData:
        """Retrieves participant data from the storage.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant.

        Returns:
            ParticipantData: The participant data.

        Raises:
            NotFoundException: If the participant does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))
        participants_storage = self._get_participants_storage(project_name)
        participant_data = participants_storage.find_one({"code": participant_code})
        if not participant_data:
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(code=participant_code, project_name=project_name)
            )
        return ParticipantData(**participant_data)

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
        existing_participant = self.get_participant_data(project_name, participant_code)
        if self.is_participant_locked(project_name, participant_code):
            raise BadRequestException(
                PARTICIPANT_IS_LOCKED.format(code=participant_code, project_name=project_name)
            )

        participant.code = participant.code.strip() if participant.code else participant_code
        existing_participant.code = (
            participant.code if participant.code else existing_participant.code
        )
        existing_participant.name = (
            participant.name if participant.name else existing_participant.name
        )
        existing_participant.notes = (
            participant.notes if (participant.notes is not None) else existing_participant.notes
        )
        existing_participant.updated_at = datetime.now()
        if participant.code != None and existing_participant.code != participant_code:
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
            self.file_management.rename_directory(
                old_name=old_name, new_name=new_name, rel_path=project_name
            )
            existing_participant.rel_location = new_name

        participants_storage = self._get_participants_storage(project_name)
        participants_storage.update({"code": participant_code}, existing_participant.model_dump())
        project_rel_location = self.project_service.get_rel_project_location(project_name)
        return ParticipantRes.from_data(existing_participant, project_rel_location)

    async def delete_participant(self, project_name: str, participant_code) -> None:
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
        rel_path = os.path.join(project_name, dir_name)
        await self.file_management.send_to_trash_async(rel_path)

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
        return self._set_participant_lock(project_name, participant_code, True)

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
        return self._set_participant_lock(project_name, participant_code, False)

    def _set_participant_lock(
        self, project_name: str, participant_code: str, locked: bool
    ) -> ParticipantRes:
        """Sets the lock status of a participant.

        Args:
            project_name (str): Name of the project.
            participant_code (str): Code of the participant.
            locked (bool): Lock status to set.

        Returns:
            ParticipantRes: The updated participant details.

        Raises:
            NotFoundException: If the participant does not exist.
        """
        participant = self.get_participant_data(project_name, participant_code)
        if participant is None:
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(code=participant_code, project_name=project_name)
            )

        participant.locked = locked
        participants_storage = self._get_participants_storage(project_name)
        participants_storage.update({"code": participant_code}, participant.model_dump())
        return ParticipantRes.from_data(
            participant,
            project_rel_location=self.project_service.get_rel_project_location(project_name),
        )

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
        participant = self.get_participant_data(project_name, participant_code)
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

    def get_participant_by_uuid(self, project_name: str, participant_uuid: str) -> ParticipantRes:
        """Retrieves a participant by their UUID from a project.

        Args:
            project_name (str): Name of the project.
            participant_uuid (str): UUID of the participant.

        Returns:
            ParticipantRes: The participant details.

        Raises:
            NotFoundException: If the project or participant does not exist.
        """
        if not self.project_service.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST.format(name=project_name))

        participants_storage = self._get_participants_storage(project_name)
        participant = participants_storage.find_one({"uuid": participant_uuid})
        if not participant:
            raise NotFoundException(
                PARTICIPANT_DOES_NOT_EXIST.format(uuid=participant_uuid, project_name=project_name)
            )
        project_rel_location = self.project_service.get_rel_project_location(project_name)
        return ParticipantRes.from_data(ParticipantData(**participant), project_rel_location)
