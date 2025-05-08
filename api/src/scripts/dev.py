import os

import uvicorn


def start():
    os.environ["APP_ENV"] = "development"
    uvicorn.run("api.main:app", host="localhost", port=8000, reload=True)


if __name__ == "__main__":
    start()
