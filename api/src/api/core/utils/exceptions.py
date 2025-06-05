class InvalidDirectoryNameError(Exception):
    def __init__(self, dir_name: str, message: str = "The directory name isn’t allowed"):
        self.dir_name = dir_name
        self.message = message
        super().__init__(f"{self.message}: {self.dir_name}")


class InvalidFileNameError(Exception):
    def __init__(self, file_name: str, message: str = "The file name isn’t allowed"):
        self.file_name = file_name
        self.message = message
        super().__init__(f"{self.message}: {self.file_name}")


class NotFoundError(Exception):
    def __init__(self, message: str = "Not found"):
        self.message = message
        super().__init__(self.message)


class UnknownError(Exception):
    def __init__(self, message: str = "An unknown error occurred"):
        self.message = message
        super().__init__(self.message)
