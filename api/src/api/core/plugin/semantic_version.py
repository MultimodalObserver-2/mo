from pydantic import BaseModel


class SemanticVersion(BaseModel):
    major: int
    minor: int
    patch: int

    def __str__(self):
        return f"{self.major}.{self.minor}.{self.patch}"
    
    @staticmethod
    def from_string(version_str: str):
        parts = version_str.split(".")
        if len(parts) != 3:
            raise ValueError(f"Invalid version string: {version_str}")
        version = {
            "major": int(parts[0]),
            "minor": int(parts[1]),
            "patch": int(parts[2]),
        }
        return SemanticVersion(**version)
