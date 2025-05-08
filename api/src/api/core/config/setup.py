import os

from api.core.config.constants import APP_DATA_DIR


def app_setup():
    """
    Setup the application by creating necessary directories.
    """
    os.makedirs(APP_DATA_DIR, exist_ok=True)
