import os

import platformdirs

# Constants for the Multimodal Observer application
# Environment variables
APP_ENVIRONMENT = os.getenv("APP_ENV", "development")
IS_DEV = APP_ENVIRONMENT == "development"
IS_PROD = APP_ENVIRONMENT == "production"

# Application metadata
APP_NAME = "multimodal-observer"
LOGGER_NAME = "mo-api"
# Application paths
RELATIVE_APP_DATA_PATH = "data"
RELATIVE_PLUGINS_DIR_PATH = "plugins" if IS_DEV else "plugins/api"
PLUGIN_METADATA_FILE = "metadata.json"
RELATIVE_LOG_PATH = "logs/api"
RELATIVE_LOCALES_PATH = "locales" if IS_DEV else "locales/api"
LOG_FILE = "mo_api.log"
APP_DATA_DIR = platformdirs.user_data_dir(APP_NAME, appauthor=False) if IS_PROD else os.getcwd()
RESOURCES_DATA_DIR = os.path.join(os.getcwd(), "resources")
