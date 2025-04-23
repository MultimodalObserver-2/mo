from datetime import datetime

from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.file_management.paths import RELATIVE_APP_DATA_PATH
from api.core.file_management.validators import FileValidators
from api.core.utils.http_exceptions import (AlreadyExistsException,
                                            BadRequestException)
from api.modules.organization.schemas.project import (ProjectPostReq,
                                                      ProjectPutReq,
                                                      ProjectRes)
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
        if self.exists(project.name):
            raise AlreadyExistsException(f"Project with name {project.name} already exists.")

        if not FileValidators.is_valid_directory_name(project.name):
            raise BadRequestException(f"Project name {project.name} isn’t allowed.")

        dir_path = self.file_management.create_directory(project.name)

        project_data = {
            "name": project.name,
            "description": project.description,
            "locked": False,
            "location": dir_path,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        self.projects_storage.insert_one(project_data)
        JsonStorage.create_storage(file_name=self._participants_data_file_name, base_path=dir_path)

        return ProjectRes(**project_data)

    def get_all_projects(self) -> list[ProjectRes]:
        projects = self.projects_storage.find_all()
        return [ProjectRes(**project) for project in projects]

    def update_project(self, project_name: str, project: ProjectPutReq) -> ProjectRes:
        new_project = self.projects_storage.find_one({"name": project_name})
        if new_project is None:
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")

        if self.is_project_locked(project_name):
            raise BadRequestException(f"Project with name {project_name} is locked.")

        new_project["name"] = project.name if project.name else new_project["name"]
        new_project["description"] = (
            project.description if project.description else new_project["description"]
        )
        new_project["updated_at"] = datetime.now()

        if project.name != None and new_project["name"] != project_name:
            if not FileValidators.is_valid_directory_name(project.name):
                raise BadRequestException(f"Project name {project.name} isn’t allowed.")

            if self.exists(project.name):
                raise AlreadyExistsException(f"Project with name {project.name} already exists.")

            new_location = self.file_management.rename_directory(
                old_name=project_name, new_name=project.name
            )
            new_project["location"] = new_location

        self.projects_storage.update({"name": project_name}, new_project)
        return ProjectRes(**new_project)

    def get_project(self, project_name: str) -> ProjectRes:
        project = self.projects_storage.find_one({"name": project_name})
        if project is None:
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")
        return ProjectRes(**project)

    def delete_project(self, project_name: str) -> None:
        if not self.exists(project_name):
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")

        if self.is_project_locked(project_name):
            raise BadRequestException(f"Project with name {project_name} is locked.")

        self.file_management.delete_directory(project_name)
        self.projects_storage.delete_one({"name": project_name})

    def lock_project(self, project_name: str) -> ProjectRes:
        project = self.projects_storage.find_one({"name": project_name})
        if project is None:
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")

        project["locked"] = True
        self.projects_storage.update({"name": project_name}, project)
        return ProjectRes(**project)

    def unlock_project(self, project_name: str) -> ProjectRes:
        project = self.projects_storage.find_one({"name": project_name})
        if project is None:
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")

        project["locked"] = False
        self.projects_storage.update({"name": project_name}, project)
        return ProjectRes(**project)

    def is_project_locked(self, project_name: str) -> bool:
        project = self.projects_storage.find_one({"name": project_name})
        if project is None:
            raise BadRequestException(f"Project with name {project_name} doesn’t exist.")
        return project["locked"]

    def exists(self, project_name: str) -> bool:
        return self.projects_storage.exists({"name": project_name})
