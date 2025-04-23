from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.modules.organization.routers.participants import participant_router
from api.modules.organization.routers.projects import project_router

app = FastAPI(
    title="Multimodal Observer API",
    description="Multimodal Observer API",
    version="0.1.0",
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


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
