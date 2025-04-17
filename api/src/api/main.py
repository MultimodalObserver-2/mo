from fastapi import FastAPI

app = FastAPI(
    title="Multimodal Observer API",
    description="Multimodal Observer API",
    version="0.1.0",
)


@app.get("/")
async def root():
    return {"message": "Hello World"}
