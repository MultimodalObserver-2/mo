from typing import Any

from fastapi import Request


def auto_cast(value: str) -> Any:
    if value.lower() == "true":
        return True
    if value.lower() == "false":
        return False
    try:
        return int(value)
    except ValueError:
        pass
    try:
        return float(value)
    except ValueError:
        pass
    return value


def parse_query_params(request: Request) -> dict[str, Any]:
    query_params = {}
    for key in request.query_params.keys():
        values = request.query_params.getlist(key)
        if len(values) == 1:
            query_params[key] = auto_cast(values[0])
        else:
            query_params[key] = [auto_cast(val) for val in values]
    return query_params
