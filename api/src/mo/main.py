import multiprocessing
import os

from mo.core.utils.i18n import set_language
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from mo.core.api.routers.plugins import plugin_router
from mo.core.config.constants import IS_DEV
from mo.core.config.logger_setup import setup_global_logger
from mo.core.config.setup import app_setup
from mo.core.plugin.dir_observer import start_plugins_dir_observer_async
from mo.core.plugin.manager import PluginManager
from mo.modules.capture.plugins.capture_plugin import CapturePlugin
from mo.modules.capture.routers.capture import capture_router
from mo.modules.capture.routers.capture_config import capture_config_router
from mo.modules.capture.routers.session import session_router
from mo.modules.organization.routers.participants import participant_router
from mo.modules.organization.routers.projects import project_router
from mo.modules.organization.routers.protocols import protocols_router
from mo.modules.visualization.routers.playback_config import playback_config_router

if __name__ == "__main__":
    # Ensure multiprocessing support is initialized for Windows
    # This is necessary to avoid issues with multiprocessing on Windows
    multiprocessing.freeze_support()

# Initialize application setup
app_setup()

logger = setup_global_logger()

app = FastAPI(
    title="Multimodal Observer API",
    description="Multimodal Observer API",
    version="0.3.0",
    docs_url="/docs" if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
)


@app.exception_handler(Exception)
async def exception_handler(request, exc):
    logger.exception(f"[API] Request {request.url} unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error"},
    )


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint, for quick status checks
@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/set-language")
def change_language(data: dict = {"lang": "en"}):
    lang = data.get("lang", "en")
    set_language(lang)
    return {"success": True, "language": lang}


plugin_management = PluginManager()
# Register here the types to check for plugins
plugin_management.register_type_to_check(CapturePlugin)

observer = start_plugins_dir_observer_async()

# Core routers
app.include_router(plugin_router)

# Organization routers
app.include_router(project_router)
app.include_router(participant_router)
app.include_router(protocols_router)

# Capture routers
app.include_router(capture_router)
app.include_router(capture_config_router)
app.include_router(session_router)

# Visualization routers
app.include_router(playback_config_router)


if __name__ == "__main__":

    def find_free_port():
        import socket

        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", 0))
            return s.getsockname()[1]

    port = int(os.getenv("API_PORT", find_free_port()))
    uvicorn.run(
        app, host="127.0.0.1", port=port, log_level="critical", access_log=False, log_config=None
    )
