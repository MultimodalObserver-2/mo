import json
from typing import Any, Optional


class Settings:
    _settings: dict[str, Any] = {}

    def __init__(self, settings: dict[str, Any] = {}):
        self._settings = settings

    def set(self, settings: dict[str, Any]):
        self._settings = settings

    def update(self, settings: dict[str, Any]):
        self._settings.update(settings)

    def get(self) -> dict[str, Any]:
        return self._settings

    def get_setting(self, key: str) -> Optional[Any]:
        return self._settings.get(key, None)

    def has_setting(self, key: str) -> bool:
        return key in self._settings

    def save_json(self, file_path: str):
        with open(file_path, "w") as f:
            json.dump(self._settings, f)

    def load_json(self, file_path: str):
        with open(file_path, "r") as f:
            self._settings = dict(json.load(f))
