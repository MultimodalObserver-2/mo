import asyncio
import logging
import os
import sys
from logging.handlers import TimedRotatingFileHandler

from mo.core.config.constants import APP_DATA_DIR, LOG_FILE, LOGGER_NAME, RELATIVE_LOG_PATH


def setup_global_logger():
    log_dir = os.path.join(APP_DATA_DIR, RELATIVE_LOG_PATH)
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, LOG_FILE)

    logger = logging.getLogger(LOGGER_NAME)
    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s - %(message)s")

    # Timed rotating file handler
    file_handler = TimedRotatingFileHandler(
        filename=log_file,
        when="midnight",  # Rotate logs at midnight
        interval=1,  # Rotate every day
        backupCount=10,  # Keep 10 backup files
        encoding="utf-8",
        utc=True,
    )
    file_handler.setFormatter(formatter)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    # Custom exception handling for uncaught exceptions
    def handle_exception(exc_type, exc_value, exc_traceback):
        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return
        logger.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))

    sys.excepthook = handle_exception

    # For asyncio event loop exceptions
    def handle_async_exception(loop, context):
        msg = context.get("exception", context["message"])
        logger.error(f"Unhandled async exception: {msg}")

    try:
        loop = asyncio.get_event_loop()
        loop.set_exception_handler(handle_async_exception)
    except RuntimeError:
        pass

    return logger
