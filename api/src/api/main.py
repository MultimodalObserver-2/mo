import os

from api.core.plugin.plugins_dir_observer import start_plugins_dir_observer
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.core.config.constants import APP_ENVIRONMENT, IS_DEV
from api.core.config.setup import app_setup
from api.modules.organization.routers.participants import participant_router
from api.modules.organization.routers.projects import project_router
from api.modules.organization.routers.protocols import protocols_router

app = FastAPI(
    title="Multimodal Observer API",
    description="Multimodal Observer API",
    version="0.1.0",
    docs_url="/docs" if IS_DEV else None,
    redoc_url="/redoc" if IS_DEV else None,
    openapi_url="/openapi.json" if IS_DEV else None,
)


@app.exception_handler(Exception)
async def exception_handler(request, exc):
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


app.include_router(project_router)
app.include_router(participant_router)
app.include_router(protocols_router)

start_plugins_dir_observer()

if __name__ == "__main__":

    def find_free_port():
        import socket

        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", 0))
            return s.getsockname()[1]

    app_setup()
    port = int(os.getenv("API_PORT", find_free_port()))
    uvicorn.run(
        app, host="127.0.0.1", port=port, log_level="critical", access_log=False, log_config=None
    )
