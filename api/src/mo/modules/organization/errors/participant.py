from mo.core.utils.i18n import translate


def PARTICIPANT_ALREADY_EXISTS(code: str, project_name: str):
    return translate("organization.participant.alreadyExists", code=code, project_name=project_name)


def PARTICIPANT_DOES_NOT_EXIST(code: str, project_name: str):
    return translate("organization.participant.doesNotExist", code=code, project_name=project_name)


def PARTICIPANT_CODE_NOT_ALLOWED(code: str):
    return translate("organization.participant.codeNotAllowed", code=code)


def PARTICIPANT_IS_LOCKED(code: str, project_name: str):
    return translate("organization.participant.isLocked", code=code, project_name=project_name)
