from mo.core.utils.i18n import translate


def project_already_exists(name: str): return translate(
    "organization.project.alreadyExists", name=name)


def project_does_not_exist(name: str): return translate(
    "organization.project.doesNotExist", name=name)


def project_name_not_allowed(name: str): return translate(
    "organization.project.nameNotAllowed", name=name)


def project_is_locked(name: str): return translate(
    "organization.project.isLocked", name=name)
