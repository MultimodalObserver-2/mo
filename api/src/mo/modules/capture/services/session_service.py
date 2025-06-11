import os
from datetime import datetime
from typing import Optional

from mo.core.api.services.plugin_service import PluginService
from mo.core.file_management.file_management import FileManagement
from mo.core.file_management.json_storage import JsonStorage
from mo.core.utils.http_exceptions import BadRequestException, NotFoundException
from mo.modules.capture.schemas.session import (
    CaptureConfigDetails,
    CaptureConfigDetailsRes,
    SessionData,
    SessionPost,
    SessionPut,
    SessionRes,
)
from mo.modules.capture.services import paths
from mo.modules.organization.services.participant_service import ParticipantService
from mo.modules.organization.services.paths import RELATIVE_PROJECTS_PATH
from mo.modules.organization.services.project_service import ProjectService


class SessionService:
    def __init__(self):
        self.project_service = ProjectService()
        self.participant_service = ParticipantService()
        self.plugin_service = PluginService()
        self.sessions_file_name = paths.CAPTURE_SESSIONS_FILE
        self.file_management = FileManagement(rel_path=RELATIVE_PROJECTS_PATH, make_dirs=False)

    def _get_session_dir_name(self, datetime_now: datetime) -> str:
        datetime_formatted = datetime_now.strftime("%Y-%m-%d_%H.%M.%S")
        return f"session[{datetime_formatted}]"

    def _get_session_storage(self, project_name: str, participant_code: str) -> JsonStorage:
        participant = self.participant_service.get_participant(project_name, participant_code)
        return JsonStorage(file_name=self.sessions_file_name, rel_path=participant.location)

    def create_session(
        self, project_name: str, participant_code: str, session: SessionPost
    ) -> SessionRes:
        participant = self.participant_service.get_participant(project_name, participant_code)
        session_dir_name = self._get_session_dir_name(session.started_at)
        self.file_management.create_directory(session_dir_name, participant.location)

        session_data = SessionData(
            session_id=session_dir_name,
            rel_location=session_dir_name,
            start_timestamp=session.start_timestamp,
            started_at=session.started_at,
            capture_sources=[
                CaptureConfigDetails(
                    config_name=source.config_name,
                    plugin_id=source.plugin_id,
                    plugin_name=source.plugin_name,
                    plugin_version=source.plugin_version,
                    settings=source.settings,
                    rel_location=os.path.join(session_dir_name, source.file_name),
                    file_extension=source.file_extension,
                )
                for source in session.capture_sources
            ],
        )
        session_storage = self._get_session_storage(project_name, participant_code)
        session_storage.insert_one(session_data.model_dump())

        return SessionRes.from_session_data(
            session_data,
            self.project_service.get_rel_project_location(project_name),
            self.participant_service._get_participant_dir_name(participant_code),
        )

    def update_session(
        self, project_name: str, participant_code: str, session_id: str, session: SessionPut
    ) -> SessionRes:
        existing_session = self._get_session_data(project_name, participant_code, session_id)
        session_data = existing_session.model_copy(update=session.model_dump(exclude_unset=True))
        existing_sources = existing_session.capture_sources
        for source in session.capture_sources:
            for existing_source in existing_sources:
                if (
                    existing_source.config_name == source.config_name
                    and source.start_timestamp is not None
                ):
                    existing_source.start_timestamp = source.start_timestamp
                    break

        session_data.capture_sources = existing_sources
        session_storage = self._get_session_storage(project_name, participant_code)
        session_storage.update({"session_id": session_id}, session_data.model_dump())
        return SessionRes.from_session_data(
            session_data,
            self.project_service.get_rel_project_location(project_name),
            self.participant_service._get_participant_dir_name(participant_code),
        )

    def add_end_timestamp(
        self, project_name: str, participant_code: str, session_id: str, end_timestamp: float
    ) -> SessionData:
        session = self._get_session_data(project_name, participant_code, session_id)
        session.end_timestamp = end_timestamp
        session_storage = self._get_session_storage(project_name, participant_code)
        session_storage.update({"session_id": session_id}, session.model_dump())
        return session

    def add_capture_source_setting_start_timestamp(
        self,
        project_name: str,
        participant_code: str,
        session_id: str,
        setting_name: str,
        start_timestamp: float,
    ) -> SessionData:
        session = self._get_session_data(project_name, participant_code, session_id)

        for source in session.capture_sources:
            if source.config_name == setting_name:
                source.start_timestamp = start_timestamp
                break
        session_storage = self._get_session_storage(project_name, participant_code)
        session_storage.update({"session_id": session_id}, session.model_dump())
        return session

    def _get_session_data(
        self, project_name: str, participant_code: str, session_id: str
    ) -> SessionData:
        session_storage = self._get_session_storage(project_name, participant_code)
        session_data_dict = session_storage.find_one({"session_id": session_id})
        if not session_data_dict:
            raise NotFoundException(f"Session with ID {session_id} not found.")
        return SessionData(**session_data_dict)

    def get_all_sessions(self, project_name: str, participant_code: str) -> list[SessionRes]:
        if not self.project_service.exists(project_name):
            raise NotFoundException(f"Project {project_name} does not exist.")

        if not self.participant_service.exists(project_name, participant_code):
            raise NotFoundException(
                f"Participant {participant_code} does not exist in project {project_name}."
            )

        session_storage = self._get_session_storage(project_name, participant_code)
        session_data_list = session_storage.find_all()
        sessions = []
        for session_data_dict in session_data_list:
            session_data = SessionData(**session_data_dict)
            session_res = SessionRes.from_session_data(
                session_data,
                self.project_service.get_rel_project_location(project_name),
                self.participant_service._get_participant_dir_name(participant_code),
            )
            sessions.append(session_res)
        return sessions

    def get_session(self, project_name: str, participant_code: str, session_id: str) -> SessionRes:
        session_data = self._get_session_data(project_name, participant_code, session_id)
        session_res = SessionRes.from_session_data(
            session_data,
            self.project_service.get_rel_project_location(project_name),
            self.participant_service._get_participant_dir_name(participant_code),
        )
        return session_res

    def delete_session(self, project_name: str, participant_code: str, session_id: str) -> None:
        session = self.get_session(project_name, participant_code, session_id)
        if self.participant_service.is_participant_locked(project_name, participant_code):
            raise BadRequestException("Cannot delete session, participant is locked.")
        self.file_management.send_to_trash(session.location)
        session_storage = self._get_session_storage(project_name, participant_code)
        session_storage.delete_one({"session_id": session_id})

    def exists(self, project_name: str, participant_code: str, session_id: str) -> bool:
        session_storage = self._get_session_storage(project_name, participant_code)
        return session_storage.exists({"session_id": session_id})
