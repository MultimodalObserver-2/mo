import platform


class SysPlatform:
    linux: bool = False
    windows: bool = False
    mac: bool = False
    
    def __init__(self, linux: bool = False, windows: bool = False, mac: bool = False) -> None:
        self.linux = linux
        self.windows = windows
        self.mac = mac

    def is_available(self) -> bool:
        operating_system = platform.system()
        return (
            (self.linux and operating_system == "Linux") or
            (self.windows and operating_system == "Windows") or
            (self.mac and operating_system == "Darwin")  # macOS
        )
