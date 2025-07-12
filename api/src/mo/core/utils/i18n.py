from os import path
import i18n
from mo.core.config.constants import RELATIVE_LOCALES_PATH, RESOURCES_DATA_DIR

locales_path = path.join(RESOURCES_DATA_DIR, RELATIVE_LOCALES_PATH)

def initialize_i18n():
    """Initialize i18n with the locales path and default settings."""
    i18n.set('file_format', 'json')
    i18n.set('locale', 'en')
    i18n.set('fallback', 'en')
    i18n.set("encoding", "utf-8")
    i18n.set('skip_locale_root_data', True)
    i18n.set("filename_format", "{namespace}.{format}")
    i18n.set("use_locale_dirs", True)
    i18n.load_path.append(locales_path)


def set_language(lang: str):
    """Set the language for i18n."""
    i18n.set('locale', lang)

def get_current_language() -> str:
    """Get the current language set in i18n."""
    return i18n.get('locale')

def translate(key: str, **kwargs) -> str:
    """Translates a given localization key using the i18n system.

    This function acts as a wrapper around `i18n.t`, making it easier to perform
    translations throughout the application. It allows passing variables to be interpolated
    in the translated string via keyword arguments.

    Args:
        key (str): The dot-separated key representing the string to translate
        **kwargs: Arbitrary keyword arguments containing variables to be interpolated
            in the localized message. Each argument should match a placeholder in the
            translation string (e.g., name="Project1", code="ABC123").

    Returns:
        str: The translated string with variables interpolated if provided.
    """
    return i18n.t(key, **kwargs)


def load_locales(path_to_load: str):
    """Load a new path for i18n."""
    i18n.load_path.append(path_to_load)
