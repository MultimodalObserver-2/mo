import os

import uvicorn


def start():
    os.environ["APP_ENV"] = "development"
    uvicorn.run(
        "mo.main:app",
        host="localhost",
        port=8000,
        reload=True,
        reload_dirs=["api/src/mo", "src/mo"],
    )


if __name__ == "__main__":
    start()
