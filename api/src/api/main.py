from fastapi import FastAPI
from fastapi.responses import JSONResponse

from api.modules.organization.routers.projects import project_router

app = FastAPI(
    title="Multimodal Observer API",
    description="Multimodal Observer API",
    version="0.1.0",
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


app.include_router(project_router)


@app.exception_handler(Exception)
async def exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error"},
    )
