import os

import platformdirs

APP_ENVIRONMENT = os.getenv("APP_ENV", "development")
IS_DEV = APP_ENVIRONMENT == "development"
IS_PROD = APP_ENVIRONMENT == "production"

APP_NAME = "multimodal-observer"
RELATIVE_APP_DATA_PATH = "data"
RELATIVE_PLUGINS_DIR_PATH = "plugins"
PLUGIN_METADATA_FILE = "metadata.json"
APP_DATA_DIR = platformdirs.user_data_dir(APP_NAME, appauthor=False) if IS_PROD else os.getcwd()
