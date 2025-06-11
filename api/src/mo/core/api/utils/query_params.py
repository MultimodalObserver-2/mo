from typing import Any

from fastapi import Request


def auto_cast(value: str) -> Any:
    """Automatically cast a string value to its appropriate type.
    Args:
        value (str): The string value to be cast.
    Returns:
        Any: The casted value, which could be a boolean, integer, float, or the original string.
    """
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
    """Parse query parameters from a FastAPI request and auto-cast their values.
    Args:
        request (Request): The FastAPI request object containing query parameters.
    Returns:
        dict[str, Any]: A dictionary of query parameters with auto-casted values.
    """
    query_params = {}
    for key in request.query_params.keys():
        values = request.query_params.getlist(key)
        if len(values) == 1:
            query_params[key] = auto_cast(values[0])
        else:
            query_params[key] = [auto_cast(val) for val in values]
    return query_params
