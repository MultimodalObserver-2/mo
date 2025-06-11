import os

import platformdirs

# Constants for the Multimodal Observer application
# Environment variables
APP_ENVIRONMENT = os.getenv("APP_ENV", "development")
IS_DEV = APP_ENVIRONMENT == "development"
IS_PROD = APP_ENVIRONMENT == "production"

# Application metadata
APP_NAME = "multimodal-observer"
# Application paths
RELATIVE_APP_DATA_PATH = "data"
RELATIVE_PLUGINS_DIR_PATH = "plugins"
PLUGIN_METADATA_FILE = "metadata.json"
APP_DATA_DIR = platformdirs.user_data_dir(APP_NAME, appauthor=False) if IS_PROD else os.getcwd()
