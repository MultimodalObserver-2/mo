
from datetime import datetime
import os
from typing import Optional
from api.core.api.services.plugin_service import PluginService
from api.core.file_management.file_management import FileManagement
from api.core.file_management.json_storage import JsonStorage
from api.core.utils.http_exceptions import BadRequestException, NotFoundException
from api.modules.capture.schemas.session import CaptureSettingDetails, CaptureSettingDetailsRes, SessionData, SessionPost, SessionRes
from api.modules.capture.services import paths
from api.modules.organization.services.participant_service import ParticipantService
from api.modules.organization.services.project_service import ProjectService


class SessionService:
    def __init__(self):
        self.file_management = FileManagement()
        self.project_service = ProjectService()
        self.participant_service = ParticipantService()
        self.plugin_service = PluginService()
        self.sessions_file_name = paths.CAPTURE_SESSIONS_FILE

    def _get_session_dir_name(self, datetime_now: Optional[datetime] = None) -> str:
        if datetime_now is None:
            datetime_now = datetime.now()
        datetime_formatted = datetime_now.strftime("%Y-%m-%d_%H.%M.%S")
        return f"session[{datetime_formatted}]"
    
    def _get_session_storage(self, project_name: str, participant_code: str) -> JsonStorage:
        participant = self.participant_service.get_participant(
            project_name, participant_code)
        return JsonStorage(file_name=self.sessions_file_name, rel_path=participant.location)

    def create_session(self, project_name: str, participant_code: str, session: SessionPost) -> SessionData:
        participant = self.participant_service.get_participant(
            project_name, participant_code)
        session_dir_name = self._get_session_dir_name(session.started_at)
        session_path = self.file_management.create_directory(session_dir_name, participant.location)

        session_data = SessionData(
            session_id=session_dir_name,
            location=session_path,
            start_timestamp=session.start_timestamp,
            started_at=session.started_at,
            capture_sources=[
                CaptureSettingDetails(
                    setting_name=source.setting_name,
                    plugin_id=source.plugin_id,
                    plugin_name=source.plugin_name,
                    plugin_version=source.plugin_version,
                    settings=source.settings,
                    location=os.path.join(session_path, source.file_name),
                    file_extension=source.file_extension,
                ) for source in session.capture_sources
            ]
        )
        session_storage = self._get_session_storage(project_name, participant_code)
        session_storage.insert_one(session_data.model_dump())

        return session_data
    
    def add_end_timestamp(
        self, project_name: str, participant_code: str, session_id: str, end_timestamp: float
    ) -> SessionData:
        session = self._get_session_data(project_name, participant_code, session_id)
        session.end_timestamp = end_timestamp
        session_storage = self._get_session_storage(
            project_name, participant_code)
        session_storage.update({"session_id": session_id}, session.model_dump())
        return session
    
    def add_all_capture_source_settings_start_timestamp(
        self, project_name: str, participant_code: str, session_id: str, setting_start_timestamps: dict[str, float]
    ) -> SessionData:
        session = self._get_session_data(project_name, participant_code, session_id)

        for source in session.capture_sources:
            if source.setting_name in setting_start_timestamps:
                source.start_timestamp = setting_start_timestamps[source.setting_name]
        
        session_storage = self._get_session_storage(
            project_name, participant_code)
        session_storage.update({"session_id": session_id}, session.model_dump())
        return session

    def add_capture_source_setting_start_timestamp(
        self, project_name: str, participant_code: str, session_id: str, setting_name: str, start_timestamp: float
    ) -> SessionData:
        session = self._get_session_data(project_name, participant_code, session_id)

        for source in session.capture_sources:
            if source.setting_name == setting_name:
                source.start_timestamp = start_timestamp
                break
        session_storage = self._get_session_storage(
            project_name, participant_code)
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
    
    def get_all_sessions(
        self, project_name: str, participant_code: str
    ) -> list[SessionRes]:
        if not self.project_service.exists(project_name):
            raise NotFoundException(f"Project {project_name} does not exist.")
        
        if not self.participant_service.exists(project_name, participant_code):
            raise NotFoundException(f"Participant {participant_code} does not exist in project {project_name}.")

        session_storage = self._get_session_storage(project_name, participant_code)
        session_data_list = session_storage.find_all()
        sessions = []
        for session_data_dict in session_data_list:
            session_data = SessionData(**session_data_dict)
            session_res = SessionRes(
                session_id=session_data.session_id,
                location=session_data.location,
                start_timestamp=session_data.start_timestamp,
                end_timestamp=session_data.end_timestamp,
                started_at=session_data.started_at,
                capture_sources=[]
            )
            for source in session_data.capture_sources:
                session_res.capture_sources.append(CaptureSettingDetailsRes.from_capture_source_setting(source))
            sessions.append(session_res)
        return sessions

    def get_session(
        self, project_name: str, participant_code: str, session_id: str
    ) -> SessionRes:
        session_data = self._get_session_data(project_name, participant_code, session_id)
        session_res = SessionRes(
            session_id=session_data.session_id,
            location=session_data.location,
            start_timestamp=session_data.start_timestamp,
            end_timestamp=session_data.end_timestamp,
            started_at=session_data.started_at,
            capture_sources=[]
        )
        for source in session_data.capture_sources:
            session_res.capture_sources.append(
                CaptureSettingDetailsRes.from_capture_source_setting(source))
        return session_res
    
    def delete_session(
        self, project_name: str, participant_code: str, session_id: str
    ) -> None:
        session_data = self._get_session_data(project_name, participant_code, session_id)
        if self.participant_service.is_participant_locked(project_name, participant_code):
            raise BadRequestException("Cannot delete session, participant is locked.")
        self.file_management.send_to_trash(session_data.location)
        session_storage = self._get_session_storage(
            project_name, participant_code)
        session_storage.delete_one({"session_id": session_id})

    def exists(
        self, project_name: str, participant_code: str, session_id: str
    ) -> bool:
        session_storage = self._get_session_storage(project_name, participant_code)
        return session_storage.exists({"session_id": session_id})
