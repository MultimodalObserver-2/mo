import re


def validate_id(identifier: str) -> str:
    """
    Validate a ID
    - Must be lowercase.
    - Can contain letters, numbers, hyphens, and underscores.
    - Must not contain spaces or special characters.
    - Must start and end with a letter or number.
    - Must be at least 2 characters long.
    Args:
        identifier (str): The identifier to validate.
    Returns:
        str: The validated plugin ID.
    """
    pattern = re.compile(r"^[a-z0-9][a-z0-9_-]*[a-z0-9]$")
    if not pattern.match(identifier):
        raise ValueError(
            "Invalid identifier. Must be lowercase, "
            "can contain letters, numbers, hyphens, and underscores, "
            "must not contain spaces or special characters, "
            "must start and end with a letter or number, "
            "and must be at least 2 characters long."
        )
    return identifier
