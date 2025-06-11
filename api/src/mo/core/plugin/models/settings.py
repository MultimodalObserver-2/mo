import json
from typing import Any, Optional


class Settings:
    _settings: dict[str, Any] = {}

    def __init__(self, settings: Optional[dict[str, Any]] = None):
        self._settings = settings if settings is not None else {}

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

    def __repr__(self) -> str:
        return f"Settings({self._settings})"

    def __str__(self) -> str:
        return json.dumps(self._settings, indent=4, ensure_ascii=False)

    def __getitem__(self, key: str) -> Any:
        return self._settings[key]

    def __setitem__(self, key: str, value: Any):
        self._settings[key] = value

    def __delitem__(self, key: str):
        if key in self._settings:
            del self._settings[key]
        else:
            raise KeyError(f"Key '{key}' not found in settings.")

    def __contains__(self, key: str) -> bool:
        return key in self._settings

    def __len__(self) -> int:
        return len(self._settings)

    def __iter__(self):
        return iter(self._settings.items())
