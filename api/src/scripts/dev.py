import os

import uvicorn


def start():
    os.environ["APP_ENV"] = "development"
    uvicorn.run(
        "api.main:app",
        host="localhost",
        port=8000,
        reload=True,
        reload_dirs=["api/src/api", "src/api"],
    )


if __name__ == "__main__":
    start()
