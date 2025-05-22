from enum import Enum
from typing import Any, Callable, Optional

from pydantic import BaseModel, PrivateAttr

from api.core.plugin.settings import Settings


class PropertyType(Enum):
    INT = "int"
    FLOAT = "float"
    TEXT = "text"
    BOOL = "bool"
    PATH = "path"
    SELECT = "select"


modified_callback_type = Callable[
    ["Properties", "Property", Settings], Optional[dict[str, "Property"]]
]


class Property(BaseModel):
    key: str
    label: str
    required: bool = True
    visible: bool = True
    enabled: bool = True
    default: Optional[Any] = None
    data: dict[str, Any] = {}
    _type: PropertyType = PrivateAttr()
    _modified_callback: Optional[modified_callback_type] = PrivateAttr(default=None)


class Properties:
    _properties: dict[str, Property]

    def __init__(self):
        self._properties = {}

    def _add_property(
        self, key: str, label: str, property_type: PropertyType, data: dict[str, Any] = {}
    ):
        if key in self._properties:
            raise ValueError(f"Property with key '{key}' already exists.")
        self._properties[key] = Property(key=key, label=label, data=data)
        self._properties[key]._type = property_type

    def add_int(
        self,
        key: str,
        label: str,
        min: Optional[int] = None,
        max: Optional[int] = None,
        step: Optional[int] = None,
    ):
        data = {}
        if min is not None:
            data["min"] = min
        if max is not None:
            data["max"] = max
        if step is not None:
            data["step"] = step
        self._add_property(key, label, PropertyType.INT, data)

    def add_float(
        self,
        key: str,
        label: str,
        min: Optional[float] = None,
        max: Optional[float] = None,
        step: Optional[float] = None,
    ):
        data = {}
        if min is not None:
            data["min"] = min
        if max is not None:
            data["max"] = max
        if step is not None:
            data["step"] = step
        self._add_property(key, label, PropertyType.FLOAT, data)

    def add_text(
        self,
        key: str,
        label: str,
        min_length: Optional[int] = None,
        max_length: Optional[int] = None,
    ):
        data = {}
        if min_length is not None:
            data["min_length"] = min_length
        if max_length is not None:
            data["max_length"] = max_length
        self._add_property(key, label, PropertyType.TEXT, data)

    def add_bool(self, key: str, label: str):
        self._add_property(key, label, PropertyType.BOOL)
        self.set_default(key, False)

    def add_path(self, key: str, label: str, file_types: Optional[list[str]] = None):
        data = {}
        if file_types is not None:
            data["file_types"] = file_types
        self._add_property(key, label, PropertyType.PATH, data)

    def add_select(
        self, key: str, label: str, options: list[str | int | float]
    ):
        data = {"options": options}
        self._add_property(key, label, PropertyType.SELECT, data)

    def _update_property_data(self, key: str, data: dict[str, Any], property_type: PropertyType):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        if self._properties[key]._type != property_type:
            raise ValueError(f"Property with key '{key}' is not of type '{property_type}'.")

        self._properties[key].data.update(data)

    def update_select_options(self, key: str, options: list[str | int | float]):
        self._update_property_data(key, {"options": options}, PropertyType.SELECT)

    def remove_property(self, key: str):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        del self._properties[key]

    def get_property(self, key: str) -> Optional[Property]:
        return self._properties.get(key, None)

    def has_property(self, key: str) -> bool:
        return key in self._properties

    def get_type(self, key: str) -> PropertyType:
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        return self._properties[key]._type

    def set_enabled(self, key: str, enabled: bool):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        self._properties[key].enabled = enabled

    def set_visible(self, key: str, visible: bool):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        self._properties[key].visible = visible

    def set_required(self, key: str, required: bool):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        self._properties[key].required = required

    def set_default(self, key: str, default: Any):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        self._properties[key].default = default

    def set_modified_callback(self, key: str, callback: modified_callback_type):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        self._properties[key]._modified_callback = callback

    def get_modified_callback(self, key: str) -> Optional[modified_callback_type]:
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        return self._properties[key]._modified_callback

    def remove_modified_callback(self, key: str):
        if key not in self._properties:
            raise ValueError(f"Property with key '{key}' does not exist.")
        self._properties[key]._modified_callback = None

    def get_default_values(self) -> dict[str, Any]:
        defaults = {}
        for key, prop in self._properties.items():
            if prop.default is not None:
                defaults[key] = prop.default
        return defaults

    def get_dict_properties(self) -> dict[str, Property]:
        return self._properties

    def get_properties(self, settings: Optional[Settings] = None) -> list[Property]:
        if settings is None:
            return list(self._properties.values())
        props = self._properties
        for key, _ in settings.get().items():
            prop = self.get_property(key)
            if prop and prop._modified_callback:
                new_prop = prop._modified_callback(self, prop, settings)
                if new_prop:
                    props = new_prop
        return list(props.values())

    def validate(self, settings: Settings) -> bool:
        props = self.get_properties(settings)

        for prop in props:
            key = prop.key
            if prop.required and key not in settings.get():
                raise ValueError(f"Property '{key}' is required.")
            if prop.enabled and key in settings.get():
                value = settings.get()[key]
                if prop._type == PropertyType.INT and not isinstance(value, int):
                    raise ValueError(f"Property '{key}' must be an int.")
                if prop._type == PropertyType.FLOAT and not isinstance(value, float) and not isinstance(value, int):
                    raise ValueError(f"Property '{key}' must be a float.")
                if prop._type == PropertyType.TEXT and not isinstance(value, str):
                    raise ValueError(f"Property '{key}' must be a string.")
                if prop._type == PropertyType.BOOL and not isinstance(value, bool):
                    raise ValueError(f"Property '{key}' must be a boolean.")
                if prop._type == PropertyType.PATH and not isinstance(value, str):
                    raise ValueError(f"Property '{key}' must be a string.")
                if (
                    prop._type == PropertyType.SELECT
                    and not isinstance(value, (str, int, float))
                    and value not in prop.data["options"]
                ):
                    raise ValueError(f"Property '{key}' must be a string, int or float.")
        return True
