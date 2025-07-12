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
from mo.modules.organization.errors.project import (
    PROJECT_ALREADY_EXISTS,
    PROJECT_DOES_NOT_EXIST,
    PROJECT_IS_LOCKED,
    PROJECT_NAME_NOT_ALLOWED,
)
from mo.modules.organization.schemas.project import (
    ProjectData,
    ProjectPostReq,
    ProjectPutReq,
    ProjectRes,
)
from mo.modules.organization.services.paths import (
    PARTICIPANTS_DATA_FILE_NAME,
    PROJECTS_DATA_FILE_NAME,
    PROJECTS_DIR_NAME,
    RELATIVE_PROJECTS_PATH,
)


class ProjectService:
    """Service class for managing projects, including creation, updating,
    deletion, locking, and unlocking of projects.

    Projects are stored as directories on the filesystem and their metadata
    is maintained in a JSON storage file.
    """

    def __init__(self):
        """Initializes the ProjectService, setting up paths and storages."""
        self._data_path = RELATIVE_APP_DATA_PATH
        self._projects_dir_name = PROJECTS_DIR_NAME
        self._data_file_name = PROJECTS_DATA_FILE_NAME
        self._participants_data_file_name = PARTICIPANTS_DATA_FILE_NAME

        self.relative_projects_path = RELATIVE_PROJECTS_PATH

        self.file_management = FileManagement(rel_path=self.relative_projects_path, make_dirs=True)
        self.projects_storage = JsonStorage(
            file_name=self._data_file_name, rel_path=self.relative_projects_path
        )

    def create_project(self, project: ProjectPostReq) -> ProjectRes:
        """Creates a new project with the given details.

        Args:
            project (ProjectPostReq): Project data to create.

        Returns:
            ProjectRes: The created project details.

        Raises:
            AlreadyExistsException: If a project with the same name already exists.
            BadRequestException: If the project name is invalid.
        """
        project.name = project.name.strip()
        if self.exists(project.name):
            raise AlreadyExistsException(PROJECT_ALREADY_EXISTS(project.name))

        if not FileValidators.is_valid_directory_name(project.name):
            raise BadRequestException(PROJECT_NAME_NOT_ALLOWED(project.name))

        dir_path = self.file_management.create_directory(project.name)

        project_data = ProjectData(
            name=project.name,
            description=project.description or "",
            rel_location=project.name,
            locked=False,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        self.projects_storage.insert_one(project_data.model_dump())
        JsonStorage.create_storage(file_name=self._participants_data_file_name, base_path=dir_path)

        return ProjectRes.from_data(project_data)

    def get_all_projects(self) -> list[ProjectRes]:
        """Retrieves all projects.

        Returns:
            list[ProjectRes]: A list of all existing projects.
        """
        projects = self.projects_storage.find_all()
        return [ProjectRes.from_data(ProjectData(**project)) for project in projects]

    def update_project(self, project_name: str, project: ProjectPutReq) -> ProjectRes:
        """Updates the details of an existing project.

        Args:
            project_name (str): Name of the project to update.
            project (ProjectPutReq): New project data.

        Returns:
            ProjectRes: The updated project details.

        Raises:
            NotFoundException: If the project does not exist.
            BadRequestException: If the project is locked or if the new name is invalid.
            AlreadyExistsException: If a project with the new name already exists.
        """
        existing_project_dict = self.projects_storage.find_one({"name": project_name})
        if existing_project_dict is None:
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))

        if self.is_project_locked(project_name):
            raise BadRequestException(PROJECT_IS_LOCKED(name=project_name))

        project.name = project.name.strip() if project.name else project_name
        existing_project = ProjectData(**existing_project_dict)
        existing_project.name = project.name if project.name else existing_project.name
        existing_project.description = (
            project.description if project.description else existing_project.description
        )
        existing_project.updated_at = datetime.now()

        if project.name != None and existing_project.name != project_name:
            if not FileValidators.is_valid_directory_name(project.name):
                raise BadRequestException(PROJECT_NAME_NOT_ALLOWED(name=project.name))

            if self.exists(project.name):
                raise AlreadyExistsException(PROJECT_ALREADY_EXISTS(name=project.name))

            self.file_management.rename_directory(old_name=project_name, new_name=project.name)
            existing_project.rel_location = project.name

        self.projects_storage.update({"name": project_name}, existing_project.model_dump())
        return ProjectRes.from_data(existing_project)

    def get_project(self, project_name: str) -> ProjectRes:
        """Retrieves a project by its name.

        Args:
            project_name (str): Name of the project.

        Returns:
            ProjectRes: The project details.

        Raises:
            NotFoundException: If the project does not exist.
        """
        project = self.projects_storage.find_one({"name": project_name})
        if project is None:
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))
        return ProjectRes.from_data(ProjectData(**project))

    async def delete_project(self, project_name: str) -> None:
        """Deletes a project by its name.

        Args:
            project_name (str): Name of the project to delete.

        Raises:
            NotFoundException: If the project does not exist.
            BadRequestException: If the project is locked.
        """
        if not self.exists(project_name):
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))

        if self.is_project_locked(project_name):
            raise BadRequestException(PROJECT_IS_LOCKED(name=project_name))

        await self.file_management.send_to_trash_async(project_name)
        self.projects_storage.delete_one({"name": project_name})

    def lock_project(self, project_name: str) -> ProjectRes:
        """Locks a project, preventing modifications.

        Args:
            project_name (str): Name of the project to lock.

        Returns:
            ProjectRes: The locked project details.

        Raises:
            NotFoundException: If the project does not exist.
        """
        return self._set_project_lock(project_name, True)

    def unlock_project(self, project_name: str) -> ProjectRes:
        """Unlocks a project, allowing modifications.

        Args:
            project_name (str): Name of the project to unlock.

        Returns:
            ProjectRes: The unlocked project details.

        Raises:
            NotFoundException: If the project does not exist.
        """
        return self._set_project_lock(project_name, False)

    def _set_project_lock(self, project_name: str, locked: bool) -> ProjectRes:
        """Sets the lock status of a project.

        Args:
            project_name (str): Name of the project.
            locked (bool): Lock status to set.

        Returns:
            ProjectRes: The updated project details.

        Raises:
            NotFoundException: If the project does not exist.
        """
        project = self.projects_storage.find_one({"name": project_name})
        if project is None:
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_name))
        project_data = ProjectData(**project)
        project_data.locked = locked
        self.projects_storage.update({"name": project_name}, project_data.model_dump())
        return ProjectRes.from_data(project_data)

    def is_project_locked(self, project_name: str) -> bool:
        """Checks if a project is locked.

        Args:
            project_name (str): Name of the project.

        Returns:
            bool: True if the project is locked, False otherwise.

        Raises:
            NotFoundException: If the project does not exist.
        """
        project = self.projects_storage.find_one({"name": project_name})
        if project is None:
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(project_name))
        return project["locked"]

    def exists(self, project_name: str) -> bool:
        """Checks if a project exists by its name.

        Args:
            project_name (str): Name of the project.

        Returns:
            bool: True if the project exists, False otherwise.
        """
        return self.projects_storage.exists({"name": project_name})
    
    def get_project_by_uuid(self, project_uuid: str) -> ProjectRes:
        """Retrieves a project by its UUID.

        Args:
            project_uuid (str): UUID of the project.

        Returns:
            ProjectRes: The project details.

        Raises:
            NotFoundException: If the project does not exist.
        """
        project = self.projects_storage.find_one({"uuid": project_uuid})
        if project is None:
            raise NotFoundException(PROJECT_DOES_NOT_EXIST(name=project_uuid))
        return ProjectRes.from_data(ProjectData(**project))

    def get_project_dir_path(self, project_name: str) -> str:
        """Generates the directory path for a given project.

        Args:
            project_name (str): Name of the project.

        Returns:
            str: Full directory path for the project.
        """
        return f"{self._data_path}/{self._projects_dir_name}/{project_name}"

    def get_rel_project_location(self, project_name: str) -> str:
        """Generates the relative location for a given project.

        Args:
            project_name (str): Name of the project.

        Returns:
            str: Relative location for the project.
        """
        return project_name
