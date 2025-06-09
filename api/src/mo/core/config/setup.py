import os

from mo.core.config.constants import (APP_DATA_DIR, RELATIVE_APP_DATA_PATH,
                                       RELATIVE_PLUGINS_DIR_PATH)


def app_setup():
    """
    Setup the application by creating necessary directories.
    """
    os.makedirs(APP_DATA_DIR, exist_ok=True)
    os.makedirs(APP_DATA_DIR + "/" + RELATIVE_APP_DATA_PATH, exist_ok=True)
    os.makedirs(APP_DATA_DIR + "/" + RELATIVE_PLUGINS_DIR_PATH, exist_ok=True)
