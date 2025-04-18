from datetime import datetime

from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.file_management.paths import RELATIVE_APP_DATA_PATH
from api.core.file_management.validators import FileValidators
from api.core.utils.http_exceptions import (AlreadyExistsException,
                                            BadRequestException)
from api.modules.organization.schemas.project import ProjectPostReq, ProjectRes
from api.modules.organization.services.paths import (
    PARTICIPANTS_DATA_FILE_NAME, PROJECTS_DATA_FILE_NAME, PROJECTS_DIR_NAME)


class ProjectService:
    def __init__(self):
        self._data_path = RELATIVE_APP_DATA_PATH
        self._projects_dir_name = PROJECTS_DIR_NAME
        self._data_file_name = PROJECTS_DATA_FILE_NAME
        self._participants_data_file_name = PARTICIPANTS_DATA_FILE_NAME

        relative_projects_path = f"{self._data_path}/{self._projects_dir_name}"

        self.file_management = FileManagement(rel_path=relative_projects_path, make_dirs=True)
        self.projects_storage = JsonStorage(
            file_name=self._data_file_name, rel_path=relative_projects_path
        )

    def create_project(self, project: ProjectPostReq) -> ProjectRes:
        if self.projects_storage.exists({"name": project.name}):
            raise AlreadyExistsException(f"Project with name {project.name} already exists.")

        if not FileValidators.is_valid_directory_name(project.name):
            raise BadRequestException(f"Project name {project.name} isn’t allowed.")

        dir_path = self.file_management.create_directory(project.name)

        project_data = {
            "name": project.name,
            "description": project.description,
            "location": dir_path,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        self.projects_storage.insert_one(project_data)
        JsonStorage.create_storage(file_name=self._participants_data_file_name, base_path=dir_path)

        return ProjectRes(**project_data)
