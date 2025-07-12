from mo.core.utils.i18n import translate


def participant_already_exists(code: str, project_name: str):
    return translate("organization.participant.alreadyExists", code=code, project_name=project_name)


def participant_does_not_exist(code: str, project_name: str):
    return translate("organization.participant.doesNotExist", code=code, project_name=project_name)


def participant_code_not_allowed(code: str):
    return translate("organization.participant.codeNotAllowed", code=code)


def participant_is_locked(code: str, project_name: str):
    return translate("organization.participant.isLocked", code=code, project_name=project_name)
