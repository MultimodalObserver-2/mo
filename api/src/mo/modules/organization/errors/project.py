from mo.core.utils.i18n import translate

def PROJECT_ALREADY_EXISTS(name: str): return translate(
    "organization.project.alreadyExists", name=name)
def PROJECT_DOES_NOT_EXIST(name: str): return translate(
    "organization.project.doesNotExist", name=name)
def PROJECT_NAME_NOT_ALLOWED(name: str): return translate(
    "organization.project.nameNotAllowed", name=name)
def PROJECT_IS_LOCKED(name: str): return translate(
    "organization.project.isLocked", name=name)
